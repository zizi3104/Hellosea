import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import auth from '../api/auth.js';
import content from '../api/content.js';
import {adminAllowed} from '../lib/auth.js';
import {validateTeam} from '../lib/content.js';
const team=JSON.parse(readFileSync(new URL('../public/team.json',import.meta.url)));
const response=()=>({code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(x){this.code=x;return this;},json(x){this.body=x;return this;}});
const req=(method,body,extra={})=>({method,body,headers:{origin:'https://hellosea.shop','content-type':'application/json',...extra}});
const ok=x=>({ok:true,status:200,json:async()=>x});
test('Only verified, explicitly approved users have administrator rights',()=>{const old=process.env.ADMIN_USER_IDS;try{process.env.ADMIN_USER_IDS='approved-id';assert.equal(adminAllowed({id:'approved-id'}),false);assert.equal(adminAllowed({id:'other',email_confirmed_at:'today',user_metadata:{admin:true}}),false);assert.equal(adminAllowed({id:'approved-id',email_confirmed_at:'today'}),true);}finally{if(old===undefined)delete process.env.ADMIN_USER_IDS;else process.env.ADMIN_USER_IDS=old;}});
test('Content validation rejects script images, invalid raster payloads, missing translations and oversized names',()=>{assert.ok(validateTeam(team));for(const mutate of [x=>x.people[0].photo='data:image/svg+xml;base64,PHN2Zz4=',x=>x.people[0].photo='data:image/png;base64,YmFk',x=>x.intro.ja='',x=>x.people[0].name='x'.repeat(61),x=>x.sample='false']){const x=structuredClone(team);mutate(x);assert.equal(validateTeam(x),null);}});
test('Content writes enforce origin, verified session and role before database access; conflicts do not overwrite',async()=>{
 const env={...process.env},oldFetch=globalThis.fetch;
 try{Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'public-test',SUPABASE_SECRET_KEY:'secret-test',ADMIN_USER_IDS:'approved-id',ALLOWED_ORIGINS:'https://hellosea.shop'});
 let dbCalls=0;let user={id:'ordinary-id',email_confirmed_at:'yes'};let result={status:'saved',revision:1};
 globalThis.fetch=async(url,opts)=>{if(url.endsWith('/user'))return ok(user);dbCalls++;assert.ok(url.endsWith('/rpc/save_team_content'));assert.equal(JSON.parse(opts.body).editor,'approved-id');return ok(result);};
 for(const [headers,code] of [[{origin:'https://evil.example'},403],[{},401],[{cookie:'hs_access=valid-token'},403]]){const r=response();await content(req('PUT',{content:team,revision:0},headers),r);assert.equal(r.code,code);}assert.equal(dbCalls,0);
 user={id:'approved-id',email_confirmed_at:'yes'};let r=response();await content(req('PUT',{content:team,revision:0},{cookie:'hs_access=valid-token'}),r);assert.equal(r.code,200);assert.equal(r.body.revision,1);
 result={status:'conflict'};r=response();await content(req('PUT',{content:team,revision:0},{cookie:'hs_access=valid-token'}),r);assert.equal(r.code,409);
 globalThis.fetch=async()=>{throw Error('offline');};r=response();await content(req('PUT',{content:team,revision:0},{cookie:'hs_access=valid-token'}),r);assert.equal(r.code,503);
 }finally{process.env=env;globalThis.fetch=oldFetch;}
});
test('Signup never grants admin or returns tokens; login uses HttpOnly cookies; logout clears them',async()=>{
 const env={...process.env},oldFetch=globalThis.fetch;
 try{Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'public-test',ADMIN_USER_IDS:'approved-id',ALLOWED_ORIGINS:'https://hellosea.shop',NODE_ENV:'production'});
 const user={id:'approved-id',email:'owner@example.com',email_confirmed_at:'yes'};globalThis.fetch=async()=>ok({access_token:'test-token',expires_in:3600,user});
 let r=response();await auth(req('POST',{action:'signup',email:user.email,password:'long-password-here',admin:true}),r);assert.equal(r.code,200);assert.ok(!r.headers['Set-Cookie']);assert.ok(!r.body.user);assert.ok(!JSON.stringify(r.body).includes('test-token'));
 r=response();await auth(req('POST',{action:'login',email:user.email,password:'long-password-here'}),r);assert.equal(r.body.user.admin,true);for(const flag of ['HttpOnly','Secure','SameSite=Strict','Path=/api'])assert.ok(r.headers['Set-Cookie'].includes(flag));assert.ok(!JSON.stringify(r.body).includes('test-token'));
 r=response();await auth(req('POST',{action:'logout'},{cookie:'hs_access=test-token'}),r);assert.equal(r.code,200);assert.ok(r.headers['Set-Cookie'].includes('Max-Age=0'));
 r=response();await auth(req('POST',{action:'login'},{origin:'https://evil.example'}),r);assert.equal(r.code,403);
 }finally{process.env=env;globalThis.fetch=oldFetch;}
});
test('Customer page has no editor controls or editor scripts; admin form is separate',()=>{const root=new URL('../public/',import.meta.url);const html=readFileSync(new URL('index.html',root),'utf8');const js=readFileSync(new URL('team.js',root),'utf8');assert.ok(!html.includes('team-editor'));assert.ok(!html.includes('editor-nav'));assert.ok(!html.includes('/admin.js'));assert.ok(!js.includes('FileReader'));const admin=readFileSync(new URL('admin.html',root),'utf8');assert.ok(admin.includes('auth-form'));assert.ok(admin.includes('content-form'));});
