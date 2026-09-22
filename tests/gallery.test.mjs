import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const photos=JSON.parse(readFileSync(new URL('public/gallery.json',root),'utf8'));
const html=readFileSync(new URL('public/index.html',root),'utf8');
test('Gallery metadata has existing assets, all locales and reusable licence provenance',()=>{
 assert.equal(new Set(photos.map(p=>p.id)).size,photos.length);
 assert.equal(photos.filter(p=>p.featured).length,1);
 for(const p of photos){
  assert.ok(existsSync(new URL(`public${p.src}`,root)));
  for(const field of ['title','location','alt'])for(const lang of ['en','ko','ja'])assert.ok(p[field][lang]);
  assert.ok(p.author&&p.license&&p.licenseUrl&&p.source&&p.changes&&p.date);
  assert.ok(html.includes(`data-open-photo="${p.id}"`));
  assert.ok(html.includes(p.source.replaceAll('&','&amp;')));
 }
 assert.ok(photos.some(p=>p.category==='surf'));assert.ok(photos.some(p=>p.category==='scenery'));
 assert.ok(html.includes('id="photo-dialog"'));assert.ok(html.includes('href="/photos"'));
});
