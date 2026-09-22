import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import manage from '../api/manage.js';
import {validatePrices,validateGallery,validateBooking,getPrices} from '../lib/management.js';
const prices=JSON.parse(readFileSync(new URL('../public/pricing.json',import.meta.url)));
const gallery=JSON.parse(readFileSync(new URL('../public/gallery.json',import.meta.url)));
const booking={id:'11111111-1111-4111-8111-111111111111',date:'2026-09-22',session:4,name:'Guest',people:3,participant_names:'Guest, Friend, Friend',plan:'three',time:'14:00',phone:'',notes:'',status:'pending'};
const response=()=>({code:200,setHeader(){},status(x){this.code=x;return this;},json(x){this.body=x;return this;}});
const ok=x=>({ok:true,status:200,json:async()=>x});
test('Prices are canonical, reject invalid amounts and use the updated packages',()=>{assert.equal(prices.find(p=>p.id==='three').price,1200000);assert.equal(prices.find(p=>p.id==='five').price,2000000);for(const value of [-1,1.5,Infinity,100000001,'400000']){const copy=structuredClone(prices);copy[0].price=value;assert.equal(validatePrices(copy),null);}assert.equal(validatePrices([...prices.slice(0,4),prices[0]]),null);});
test('Photo validation preserves licences and rejects scripts, traversal, multiple heroes and invalid images',()=>{assert.equal(validateGallery(gallery)[0].changes,gallery[0].changes);for(const change of [x=>x[0].src='data:image/svg+xml;base64,PHN2Zz4=',x=>x[0].src='/assets/../secret.jpg',x=>x[0].src='data:image/png;base64,YmFk',x=>x[1].featured=true,x=>x[0].source='javascript:alert(1)',x=>x[0].title.ko='']){const copy=structuredClone(gallery);change(copy);assert.equal(validateGallery(copy),null);}});
test('Bookings enforce real dates, four sessions and valid headcounts',()=>{assert.ok(validateBooking(booking));for(const change of [{date:'2026-02-30'},{session:0},{session:5},{people:0},{people:1.5},{people:51},{name:' '},{status:'admin'},{inquiry_id:'bad'}])assert.equal(validateBooking({...booking,...change}),null);});
test('Private endpoints and writes require approved verified identity; stale writes return conflict',async()=>{
const env={...process.env},oldFetch=globalThis.fetch;
try{
Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'test-public',SUPABASE_SECRET_KEY:'test-secret',ADMIN_USER_IDS:booking.id,ALLOWED_ORIGINS:'https://hellosealombok.com'});
let user={id:'ordinary',email_confirmed_at:'yes'},calls=0,result={status:'saved',revision:2};
globalThis.fetch=async(url,options)=>{if(url.endsWith('/user'))return ok(user);calls++;if(options?.body)assert.equal(JSON.parse(options.body).editor,booking.id);return ok(result);};
const request=(method,section,body,cookie=true)=>({method,url:'/api/manage?section='+section,body,headers:{origin:'https://hellosealombok.com','content-type':'application/json',...(cookie?{cookie:'hs_access=test'}:{})}});
for(const section of ['bookings','inquiries']){let r=response();await manage(request('GET',section,null,false),r);assert.equal(r.code,401);r=response();await manage(request('GET',section),r);assert.equal(r.code,403);}assert.equal(calls,0);
user={id:booking.id,email_confirmed_at:'yes'};let r=response(),req=request('PUT','pricing',{content:prices,revision:1});req.headers.origin='https://evil.example';await manage(req,r);assert.equal(r.code,403);assert.equal(calls,0);
r=response();await manage(request('PUT','pricing',{content:prices,revision:1}),r);assert.equal(r.code,200);assert.equal(calls,1);
for(const status of ['conflict','duplicate']){result={status};r=response();await manage(request('POST','bookings',{content:booking,revision:0}),r);assert.equal(r.code,409);}
r=response();await manage(request('POST','bookings','{broken'),r);assert.equal(r.code,400);
result=[{content:prices.map(p=>({...p,price:p.price+1000}))}];assert.equal((await getPrices())[0].price,401000);
result=[{content:[]}];await assert.rejects(getPrices);
}finally{process.env=env;globalThis.fetch=oldFetch;}
});

test('Owner email must be server-approved and verified; metadata cannot grant access', async()=>{
 const {adminAllowed}=await import('../lib/auth.js');const old=process.env.ADMIN_EMAILS;
 try{process.env.ADMIN_EMAILS='hellosea@hellosealombok.com';
 assert.equal(adminAllowed({id:'x',email:'hellosea@hellosealombok.com'}),false);
 assert.equal(adminAllowed({id:'x',email:'guest@example.com',email_confirmed_at:'yes',user_metadata:{email:'hellosea@hellosealombok.com',admin:true}}),false);
 assert.equal(adminAllowed({id:'x',email:'hellosea@hellosealombok.com',email_confirmed_at:'yes'}),true);
 }finally{if(old===undefined)delete process.env.ADMIN_EMAILS;else process.env.ADMIN_EMAILS=old;}
});
test('Legacy server key uses bearer auth; modern secret key does not',async()=>{
 const {serverHeaders}=await import('../lib/content.js');const old=process.env.SUPABASE_SECRET_KEY;
 try{process.env.SUPABASE_SECRET_KEY='eyJtest';assert.equal(serverHeaders().Authorization,'Bearer eyJtest');process.env.SUPABASE_SECRET_KEY='sb_secret_test';assert.equal(serverHeaders().Authorization,undefined);}finally{if(old===undefined)delete process.env.SUPABASE_SECRET_KEY;else process.env.SUPABASE_SECRET_KEY=old;}
});
