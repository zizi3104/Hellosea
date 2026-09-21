import {authConfigured,adminAllowed,getUser,mutationAllowed} from '../lib/auth.js';
import {validateTeam,db} from '../lib/content.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!['GET','PUT'].includes(req.method)){res.setHeader('Allow','GET, PUT');return res.status(405).json({error:'Method not allowed.'});}
 if(req.method==='PUT'&&!mutationAllowed(req))return res.status(403).json({error:'이 사이트에서 다시 시도해주세요.'});
 if(!authConfigured()||!process.env.SUPABASE_SECRET_KEY)return res.status(503).json({error:'콘텐츠 저장 연결을 준비 중입니다.'});
 try{
  if(req.method==='GET'){const r=await db('site_content?id=eq.team&select=content,revision');if(!r.ok)throw Error();const rows=await r.json();return res.status(200).json(rows[0]||{content:null,revision:0});}
  const user=await getUser(req);if(!user)return res.status(401).json({error:'로그인이 만료되었습니다. 다시 로그인해주세요.'});if(!adminAllowed(user))return res.status(403).json({error:'승인된 관리자만 수정할 수 있습니다.'});
  let body=req.body;if(typeof body==='string')body=JSON.parse(body);if(!body||Buffer.byteLength(JSON.stringify(body))>2900000)return res.status(413).json({error:'사진 용량을 줄여주세요.'});
  const value=validateTeam(body.content);if(!value||!Number.isSafeInteger(body.revision)||body.revision<0)return res.status(400).json({error:'세 언어의 소개글과 사진 형식을 확인해주세요.'});
  const r=await db('rpc/save_team_content',{method:'POST',body:JSON.stringify({payload:value,expected_revision:body.revision,editor:user.id})});if(!r.ok)throw Error();const result=await r.json();if(result.status==='conflict')return res.status(409).json({error:'다른 관리자가 먼저 수정했습니다. 입력 내용을 보관한 뒤 최신 내용을 불러와 다시 수정해주세요.'});if(result.status!=='saved')throw Error();return res.status(200).json({revision:result.revision});
 }catch{return res.status(503).json({error:'저장 상태를 확인하지 못했습니다. 최신 내용을 불러와 확인해주세요.'});}
}
