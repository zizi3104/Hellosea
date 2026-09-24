import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {customerPages,renderCustomerPage,pageForPath} from '../scripts/pages.mjs';
const read=name=>readFileSync(new URL(`../${name}`,import.meta.url),'utf8');
const template=read('public/index.html');
const app=read('public/app.js');
const pricing=read('public/pricing.js');
const css=read('public/styles.css');
const vercel=JSON.parse(read('vercel.json'));
const dev=read('scripts/dev.mjs');

const routes={home:'/',story:'/our-story',goods:'/goods',surf:'/ayo-surf',photos:'/photos',faq:'/q-and-a',booking:'/booking-inquiry'};

test('Header navigation uses separate canonical pages',()=>{
 for(const [id,route] of Object.entries(routes))assert.ok(template.includes(`href="${route}" data-page-link="${id}"`),`${id} does not link to ${route}`);
 assert.equal((template.match(/data-page-link=/g)||[]).length,7);
 assert.ok(!template.includes('href="#story"'));
 assert.ok(!template.includes('href="#gallery"'));
 assert.ok(!template.includes('href="#faq"'));
 assert.ok(!template.includes('href="#inquire"'));
});

test('Build renderer creates seven page-specific documents from one validated template',()=>{
 assert.equal(customerPages.length,7);
 for(const page of customerPages){
  const html=renderCustomerPage(template,page);
  assert.ok(html.includes(`<body data-page="${page.id}">`));
  assert.ok(html.includes(`<title>${page.title}</title>`));
  assert.ok(html.includes(`content="${page.description}"`));
  assert.equal(pageForPath(page.path)?.id,page.id);
  assert.equal(pageForPath(page.path==='/'?'/':`${page.path}/`)?.id,page.id);
 }
 for(const panel of ['home','story','goods','surf','photos','faq','booking'])assert.ok(template.includes(`data-page-panel="${panel}"`));
 assert.ok(css.includes('body[data-page="booking"] [data-page-panel]:not([data-page-panel="booking"])'));
 assert.ok(css.includes('a[aria-current="page"]'));
});

test('Cross-page calls to action preserve booking choices',()=>{
 assert.ok(template.includes('href="/booking-inquiry" data-i18n="heroCta"'));
 assert.ok(template.includes('href="/photos" data-i18n="browsePhotos"'));
 assert.ok(template.includes('href="/booking-inquiry" data-i18n="teamCta"'));
 assert.ok(app.includes("location.href=`/booking-inquiry?level=${encodeURIComponent(button.dataset.level)}`"));
 assert.ok(app.includes("new URLSearchParams(location.search).get('level')"));
 assert.ok(pricing.includes('`/booking-inquiry?plan=${encodeURIComponent(p.id)}`'));
 assert.ok(pricing.includes("new URLSearchParams(location.search).get('plan')"));
});

test('Legacy single-page hashes and direct route refreshes remain supported',()=>{
 for(const route of ['/our-story','/goods','/ayo-surf','/photos','/q-and-a','/booking-inquiry'])assert.ok(app.includes(route));
 const rewrites=new Map(vercel.rewrites.map(rule=>[rule.source,rule.destination]));
 for(const page of customerPages.filter(page=>page.path!=='/')){
  assert.equal(rewrites.get(page.path),`/${page.output}`);
  assert.equal(rewrites.get(`${page.path}/`),`/${page.output}`);
 }
 assert.ok(dev.includes("pageForPath(pathname)"));
 assert.ok(dev.includes('renderCustomerPage(template,customerPage)'));
});

test('Goods page is an in-person catalog without online commerce',()=>{
 assert.ok(template.includes('href="/goods" data-page-link="goods"'));
 assert.ok(template.includes('data-page-panel="goods"'));
 assert.ok(template.includes('data-i18n="goodsAvailabilityText"'));
 assert.ok(template.includes('/assets/goods/sticker-pack.svg'));
 assert.ok(template.includes('/assets/goods/keyring.svg'));
 const goods=template.slice(template.indexOf('<section id="goods"'),template.indexOf('<section id="ayosurf"'));
 assert.ok(!/add to cart|checkout|payment|buy now/i.test(goods));
 assert.ok(!goods.includes('<form'));
});
