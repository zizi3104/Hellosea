import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { validateInquiry, lombokDate } from '../lib/validation.js';
import handler from '../api/inquiries.js';
const example = () => ({requestId:randomUUID(),name:'Test Surfer',email:'test@example.com',phone:'',preferredDate:'',preferredTime:'',people:2,level:'first-time',message:'',consent:true,website:''});
test('Lombok date changes at UTC+8; invalid calendar and past dates are rejected', () => {
  const now=new Date('2026-09-21T17:00:00Z');
  assert.equal(lombokDate(now),'2026-09-22');
  assert.ok(validateInquiry({...example(),preferredDate:'2026-09-21'},now).error);
  assert.ok(validateInquiry({...example(),preferredDate:'2027-02-30'},now).error);
  assert.ok(validateInquiry({...example(),preferredDate:'2026-09-22'},now).value);
});
test('Personal details and preferred time are validated', () => {
  for(const patch of [{consent:'true'},{people:1.5},{people:99},{email:'bad'},{name:'x'},{level:'admin'},{website:'spam.example'},{message:'x'.repeat(2001)},{phone:'words'},{preferredTime:'04:00'},{preferredTime:'16:30'},{preferredTime:'17:00'}]) assert.ok(validateInquiry({...example(),...patch}).error);
  assert.equal(validateInquiry({...example(),email:' TEST@EXAMPLE.COM '}).value.email,'test@example.com');
  for(const preferredTime of ['05:00','09:00','12:00','16:00']) assert.match(validateInquiry({...example(),preferredTime,message:'Board preference'},new Date()).value.message,new RegExp(preferredTime));
});
function response() { return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},status(code){this.statusCode=code;return this},json(value){this.body=value;return this}}; }
test('Endpoint rejects public reads, foreign origins, and missing database configuration', async () => {
  const saved={...process.env};
  try {
    process.env.ALLOWED_ORIGINS='https://hellosea.shop'; delete process.env.SUPABASE_URL;
    for(const [method,origin,expected] of [['GET','https://hellosea.shop',405],['POST','https://evil.example',403],['POST','https://hellosea.shop',503]]) {
      const res=response(); await handler({method,headers:{origin,'content-type':'application/json'},body:example()},res);
      assert.equal(res.statusCode,expected); assert.notEqual(res.body.ok,true);
    }
  } finally { process.env=saved; }
});
test('Endpoint reports saved, limited and failed writes honestly without exposing secrets', async () => {
  const saved={...process.env}, originalFetch=globalThis.fetch;
  try {
    Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SECRET_KEY:'sb_secret_test-only',RATE_LIMIT_SECRET:'x'.repeat(32),ALLOWED_ORIGINS:'https://hellosea.shop'});
    for(const [result,expected] of [[{status:'accepted'},201],[{status:'limited'},429],[{status:'unexpected'},503]]) {
      let sent;
      globalThis.fetch=async(url,options)=>{sent=options; return {ok:true,json:async()=>result}};
      const res=response(); await handler({method:'POST',headers:{origin:'https://hellosea.shop','content-type':'application/json'},body:example(),socket:{remoteAddress:'127.0.0.1'}},res);
      assert.equal(res.statusCode,expected);
      assert.equal(sent.headers.apikey,'sb_secret_test-only');
      assert.match(JSON.parse(sent.body).client_hash,/^[a-f0-9]{64}$/);
      assert.ok(!JSON.stringify(res.body).includes('sb_secret'));
      assert.ok(!sent.body.includes('127.0.0.1'));
    }
    globalThis.fetch=async()=>{throw new Error('internal secret')};
    const res=response(); await handler({method:'POST',headers:{origin:'https://hellosea.shop','content-type':'application/json'},body:example()},res);
    assert.equal(res.statusCode,503); assert.ok(!JSON.stringify(res.body).includes('internal secret'));
  } finally {process.env=saved; globalThis.fetch=originalFetch;}
});
