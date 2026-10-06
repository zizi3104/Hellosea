import test from 'node:test';
import assert from 'node:assert/strict';
import reviews from '../api/reviews.js';
import {REVIEW_PAGE_SIZE,REVIEW_PRIVACY_VERSION,reviewPage,reviewPaths,validateReviewSubmission} from '../lib/reviews.js';

const valid={requestId:'11111111-1111-4111-8111-111111111111',displayName:'Surfer',body:'A safe and memorable surf lesson.',bodyEn:'',locale:'ko',consent:true,privacyVersion:REVIEW_PRIVACY_VERSION,media:[]};
const response=()=>({code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(x){this.code=x;return this;},json(x){this.body=x;return this;}});

test('Review validation supports optional photos with strict limits',()=>{
 assert.equal(validateReviewSubmission(valid).media_count,0);
 const photo={mimeType:'image/jpeg',size:1024,previewSize:512,width:1600,height:1200};
 const withPhoto=validateReviewSubmission({...valid,media:[photo]});
 assert.equal(withPhoto.media_count,1);
 assert.deepEqual(reviewPaths(valid.requestId,0,'image/png'),{original:`${valid.requestId}/01-original.png`,preview:`${valid.requestId}/01-preview.jpg`});
 for(const change of [x=>x.body='short',x=>x.displayName='x'.repeat(61),x=>x.media=Array(6).fill(photo),x=>x.media=[{...photo,size:10*1024*1024+1}],x=>x.media=[{...photo,mimeType:'image/gif'}],x=>x.consent=false]){const copy=structuredClone(valid);change(copy);assert.equal(validateReviewSubmission(copy),null);}
 assert.equal(REVIEW_PAGE_SIZE,10);assert.equal(reviewPage('2'),2);assert.equal(reviewPage('-1'),1);
});

test('Public text reviews are fetched ten per page and only from published rows',async()=>{
 const env={...process.env},oldFetch=globalThis.fetch;let requested='';
 try{
  Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SECRET_KEY:'sb_secret_test',RATE_LIMIT_SECRET:'x'.repeat(32)});
  globalThis.fetch=async url=>{requested=String(url);return new Response(JSON.stringify(Array.from({length:10},(_,i)=>({id:String(i),body:'Review '+i,media_count:0}))),{status:200,headers:{'Content-Type':'application/json','Content-Range':'10-19/25'}});};
  const res=response();await reviews({method:'GET',url:'/api/reviews?kind=text&page=2',headers:{}},res);
  assert.equal(res.code,200);assert.equal(res.body.rows.length,10);assert.equal(res.body.page,2);assert.equal(res.body.pageSize,10);assert.equal(res.body.pages,3);
  assert.ok(requested.includes('status=eq.published'));assert.ok(requested.includes('media_count=eq.0'));assert.ok(requested.includes('limit=10'));assert.ok(requested.includes('offset=10'));
 }finally{process.env=env;globalThis.fetch=oldFetch;}
});

test('Invalid submissions are rejected before database access and admin reads require login',async()=>{
 const env={...process.env},oldFetch=globalThis.fetch;let calls=0;
 try{
  Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SECRET_KEY:'sb_secret_test',RATE_LIMIT_SECRET:'x'.repeat(32)});
  globalThis.fetch=async()=>{calls++;throw Error('unexpected');};
  let res=response();await reviews({method:'POST',url:'/api/reviews',headers:{origin:'http://localhost:3000','content-type':'application/json'},body:{...valid,body:'short'}},res);assert.equal(res.code,400);assert.equal(calls,0);
  res=response();await reviews({method:'GET',url:'/api/reviews?admin=1&status=pending',headers:{}},res);assert.equal(res.code,401);assert.equal(calls,0);
 }finally{process.env=env;globalThis.fetch=oldFetch;}
});
