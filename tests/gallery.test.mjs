import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const media=JSON.parse(readFileSync(new URL('public/gallery.json',root),'utf8'));
const html=readFileSync(new URL('public/index.html',root),'utf8');
const js=readFileSync(new URL('public/gallery.js',root),'utf8');

test('Gallery uses six first-party HELLO SEA photos and videos',()=>{
 assert.equal(media.length,6);
 assert.equal(new Set(media.map(p=>p.id)).size,media.length);
 assert.equal(media.filter(p=>p.featured).length,1);
 assert.equal(media.filter(p=>p.kind==='image').length,2);
 assert.equal(media.filter(p=>p.kind==='video').length,4);
 for(const item of media){
  assert.ok(existsSync(new URL(`public${item.src}`,root)));
  if(item.kind==='video'){
   assert.ok(item.poster&&existsSync(new URL(`public${item.poster}`,root)));
   assert.ok(item.duration>0);
   assert.match(item.src,/^\/assets\/videos\/.+\.mp4$/);
  }
  for(const field of ['title','location','alt'])for(const lang of ['en','ko','ja'])assert.ok(item[field][lang]);
  assert.equal(item.author,'HELLO SEA LOMBOK');
  assert.equal(item.license,'Original content');
  assert.equal(item.source,'');
  assert.equal(item.licenseUrl,'');
  assert.ok(item.changes&&item.date);
  assert.ok(html.includes(`data-open-photo="${item.id}"`));
  assert.ok(html.includes(item.poster||item.src));
 }
 assert.ok(media.some(p=>p.category==='surf'));
 assert.ok(media.some(p=>p.category==='scenery'));
 assert.ok(!html.includes('wikimedia.org'));
 assert.ok(!html.includes('gerupuk-beach.jpg'));
});

test('Gallery viewer enlarges photos and plays videos accessibly',()=>{
 assert.ok(html.includes('id="photo-dialog"'));
 assert.ok(html.includes('id="photo-media"'));
 assert.ok(html.includes('href="/photos"'));
 assert.ok(js.includes("video.controls=true"));
 assert.ok(js.includes("video.playsInline=true"));
 assert.ok(js.includes("video.preload='metadata'"));
 assert.ok(js.includes("dialog.addEventListener('keydown'"));
 assert.ok(js.includes("$('#photo-media').replaceChildren()"));
});
