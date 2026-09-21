import {authConfigured,adminAllowed,cookieToken,cookie,mutationAllowed,authRequest,getUser} from '../lib/auth.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Method not allowed.'});}
 if(req.method==='POST'&&!mutationAllowed(req))return res.status(403).json({error:'이 사이트에서 다시 시도해주세요.'});
 if(!authConfigured())return res.status(503).json({error:'회원 기능을 준비 중입니다. 아직 계정 연결이 완료되지 않았습니다.'});
 try{
  if(req.method==='GET'){const user=await getUser(req);return res.status(200).json({user:user?{email:user.email,admin:adminAllowed(user)}:null});}
  let body=req.body;if(typeof body==='string')body=JSON.parse(body);if(!body||Buffer.byteLength(JSON.stringify(body))>4096)return res.status(400).json({error:'입력 내용을 확인해주세요.'});
  if(body.action==='logout'){
   const token=cookieToken(req);if(token){const r=await authRequest('logout',{method:'POST',headers:{Authorization:`Bearer ${token}`}});if(!r.ok&&r.status!==401&&r.status!==403)return res.status(503).json({error:'로그아웃하지 못했습니다. 다시 시도해주세요.'});}
   cookie(res);return res.status(200).json({ok:true});
  }
  if(!['signup','login'].includes(body.action))return res.status(400).json({error:'잘못된 요청입니다.'});
  if(typeof body.email!=='string'||body.email.length>254||!/^\S+@\S+\.\S+$/.test(body.email)||typeof body.password!=='string'||body.password.length>128||body.password.length<(body.action==='signup'?12:1))return res.status(400).json({error:'이메일과 비밀번호를 확인해주세요. 가입 비밀번호는 12자 이상이어야 합니다.'});
  const r=await authRequest(body.action==='signup'?`signup?redirect_to=${encodeURIComponent(req.headers.origin+'/admin')}`:'token?grant_type=password',{method:'POST',body:JSON.stringify({email:body.email.trim(),password:body.password})});
  if(!r.ok)return res.status(r.status===429?429:400).json({error:r.status===429?'요청이 많습니다. 잠시 후 다시 시도해주세요.':body.action==='login'?'이메일, 비밀번호 또는 이메일 인증 상태를 확인해주세요.':'가입 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'});
  const result=await r.json();
  if(body.action==='signup')return res.status(200).json({message:'가입 가능한 이메일이면 인증 메일이 발송됩니다. 메일 인증 후 로그인해주세요. 가입만으로 관리자 권한이 부여되지는 않습니다.'});
  if(!result.access_token||!result.user?.email_confirmed_at)return res.status(403).json({error:'이메일 인증 후 로그인해주세요.'});
  cookie(res,result.access_token,Math.min(Number(result.expires_in)||3600,3600));return res.status(200).json({user:{email:result.user.email,admin:adminAllowed(result.user)}});
 }catch{return res.status(503).json({error:'요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'});}
}
