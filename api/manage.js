import {authConfigured,adminAllowed,getUser,mutationAllowed} from '../lib/auth.js';
import {db} from '../lib/content.js';
import {validatePrices,validateGallery,validateBooking,uuid,validDate} from '../lib/management.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!['GET','PUT','POST','PATCH'].includes(req.method))return res.status(405).json({error:'Method not allowed'});
 const query=new URL(req.url,'https://localhost').searchParams,section=query.get('section');
 if(!['pricing','gallery','bookings','inquiries'].includes(section))return res.status(400).json({error:'잘못된 요청입니다.'});
 const publicRead=req.method==='GET'&&['pricing','gallery'].includes(section);
 if(req.method!=='GET'&&!mutationAllowed(req))return res.status(403).json({error:'관리자 페이지에서 다시 시도해주세요.'});
 if(!authConfigured()||!process.env.SUPABASE_SECRET_KEY)return res.status(503).json({error:'서버 연결 설정이 필요합니다.'});
 try{
 let user;if(!publicRead){user=await getUser(req);if(!user)return res.status(401).json({error:'다시 로그인해주세요.'});if(!adminAllowed(user))return res.status(403).json({error:'관리자 권한이 필요합니다.'});}
 if(req.method==='GET'){
 let path;
 if(publicRead)path=`site_content?id=eq.${section}&select=content,revision`;
 if(section==='bookings'){const from=query.get('from'),to=query.get('to');if(!validDate(from)||!validDate(to)||from>to||Date.parse(to)-Date.parse(from)>93*86400000)return res.status(400).json({error:'조회 날짜를 확인해주세요.'});path=`surf_bookings?date=gte.${from}&date=lte.${to}&order=date,session,created_at&limit=1000`;}
 if(section==='inquiries'){const offset=Number(query.get('offset')||0),status=query.get('status')||'all';if(!Number.isSafeInteger(offset)||offset<0||!['all','new','contacted','closed'].includes(status))return res.status(400).json({error:'조회 조건을 확인해주세요.'});path=`surf_inquiries?select=id,created_at,name,email,phone,preferred_date,people,level,message,status&order=created_at.desc&limit=50&offset=${offset}${status==='all'?'':`&status=eq.${status}`}`;}
 const r=await db(path);if(!r.ok)throw Error();const rows=await r.json();return res.status(200).json(publicRead?(rows[0]||{content:null,revision:0}):{rows,truncated:section==='bookings'&&rows.length===1000});
 }
 let body=req.body;if(typeof body==='string'){try{body=JSON.parse(body);}catch{return res.status(400).json({error:'입력 내용을 확인해주세요.'});}}if(!body||Buffer.byteLength(JSON.stringify(body))>2900000)return res.status(413).json({error:'저장 용량을 초과했습니다. 사진 수나 크기를 줄여주세요.'});
 if(section==='inquiries'){
 if(req.method!=='PATCH'||!uuid(body.id)||!['new','contacted','closed'].includes(body.status))return res.status(400).json({error:'문의 상태를 확인해주세요.'});
 const r=await db(`surf_inquiries?id=eq.${body.id}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status:body.status})});if(!r.ok)throw Error();const rows=await r.json();return res.status(rows.length?200:404).json(rows.length?{ok:true}:{error:'문의를 찾지 못했습니다.'});
 }
 if(!Number.isSafeInteger(body.revision)||body.revision<0)return res.status(400).json({error:'최신 내용을 다시 불러오세요.'});
 const value=section==='pricing'?validatePrices(body.content):section==='gallery'?validateGallery(body.content):validateBooking(body.content);if(!value)return res.status(400).json({error:'입력 내용을 확인해주세요. 사진은 최대 12장, 대표 사진은 1장입니다.'});
 const r=await db(section==='bookings'?'rpc/save_surf_booking':'rpc/save_site_section',{method:'POST',body:JSON.stringify({...(section==='bookings'?{}:{section}),payload:value,expected_revision:body.revision,editor:user.id})});if(!r.ok)throw Error();const result=await r.json();if(['conflict','duplicate'].includes(result.status))return res.status(409).json({error:result.status==='duplicate'?'이미 달력에 등록된 문의입니다. 해당 날짜에서 확인해주세요.':'다른 수정이 먼저 저장됐습니다. 최신 내용을 불러온 뒤 다시 수정해주세요.'});if(result.status!=='saved')throw Error();return res.status(200).json(result);
 }catch{return res.status(503).json({error:'처리 결과를 확인하지 못했습니다. 새로고침 후 다시 확인해주세요.'});}
}
