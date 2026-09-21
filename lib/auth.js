import {allowedOrigins} from './config.js';
export function authConfigured(){try{return new URL(process.env.SUPABASE_URL).protocol==='https:'&&Boolean(process.env.SUPABASE_PUBLISHABLE_KEY);}catch{return false;}}
export function adminAllowed(user){return Boolean(user?.id&&user.email_confirmed_at&&(process.env.ADMIN_USER_IDS||'').split(',').map(x=>x.trim()).includes(user.id));}
export function cookieToken(req){const value=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('hs_access='))?.slice(10);return value&&/^[A-Za-z0-9._-]+$/.test(value)?value:null;}
export function cookie(res,token='',age=0){res.setHeader('Set-Cookie',`hs_access=${token}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${age}${process.env.NODE_ENV==='production'||process.env.VERCEL?'; Secure':''}`);}
export function mutationAllowed(req){return allowedOrigins().has(req.headers.origin)&&(req.headers['content-type']||'').startsWith('application/json');}
export async function authRequest(path,options={}){return fetch(`${process.env.SUPABASE_URL.replace(/\/$/,'')}/auth/v1/${path}`,{...options,headers:{apikey:process.env.SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(8000)});}
export async function getUser(req){const token=cookieToken(req);if(!token)return null;const response=await authRequest('user',{headers:{Authorization:`Bearer ${token}`}});if(response.status===401||response.status===403)return null;if(!response.ok)throw Error('Authentication unavailable');return response.json();}
