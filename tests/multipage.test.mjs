import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {customerPages,renderCustomerPage,pageForPath} from '../scripts/pages.mjs';
const read=name=>readFileSync(new URL(`../${name}`,import.meta.url),'utf8');
const template=read('public/index.html');
const app=read('public/app.js');
const pricing=read('public/pricing.js');
const css=read('public/styles.css');
const vercel=JSON.parse(read('vercel.json'));
const dev=read('scripts/dev.mjs');
const i18n=read('public/i18n.js');
const sticker=read('public/assets/goods/sticker-pack.svg');
const gallery=read('public/gallery.js');
const galleryBuilder=read('scripts/gallery.mjs');
const teamJs=read('public/team.js');
const reviewJs=read('public/review.js');
const robots=read('public/robots.txt');
const sitemap=read('public/sitemap.xml');

const routes={home:'/',story:'/our-story',goods:'/goods',surf:'/ayo-surf',photos:'/photos',faq:'/q-and-a',review:'/review',booking:'/booking-inquiry'};

test('Header navigation uses separate canonical pages',()=>{
 for(const [id,route] of Object.entries(routes))assert.ok(template.includes(`href="${route}" data-page-link="${id}"`),`${id} does not link to ${route}`);
 assert.equal((template.match(/data-page-link=/g)||[]).length,8);
 assert.ok(!template.includes('href="#story"'));
 assert.ok(!template.includes('href="#gallery"'));
 assert.ok(!template.includes('href="#faq"'));
 assert.ok(!template.includes('href="#inquire"'));
});

test('Build renderer creates eight page-specific documents from one validated template',()=>{
 assert.equal(customerPages.length,8);
 for(const page of customerPages){
  const html=renderCustomerPage(template,page);
  assert.ok(html.includes(`<body data-page="${page.id}">`));
  assert.ok(html.includes(`<title>${page.title}</title>`));
  assert.ok(html.includes(`content="${page.description}"`));
  const canonical=`https://hellosealombok.com${page.path==='/'?'/':page.path}`;
  assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`));
  assert.ok(html.includes(`<meta property="og:url" content="${canonical}">`));
  assert.equal(pageForPath(page.path)?.id,page.id);
  assert.equal(pageForPath(page.path==='/'?'/':`${page.path}/`)?.id,page.id);
 }
 for(const panel of ['home','story','goods','surf','photos','faq','review','booking'])assert.ok(template.includes(`data-page-panel="${panel}"`));
 assert.ok(css.includes('body[data-page="review"] [data-page-panel]:not([data-page-panel="review"])'));
 assert.ok(css.includes('body[data-page="booking"] [data-page-panel]:not([data-page-panel="booking"])'));
 assert.ok(css.includes('a[aria-current="page"]'));
});

test('Homepage hero uses the supplied autoplaying responsive video',()=>{
 assert.ok(template.includes('class="hero-photo hero-video"'));
 assert.ok(template.includes('src="/assets/hello-sea-main.mp4"'));
 for(const attr of ['autoplay','muted','loop','playsinline'])assert.match(template,new RegExp(`<video[^>]*\\b${attr}\\b`));
 assert.ok(existsSync(new URL('../public/assets/hello-sea-main.mp4',import.meta.url)));
 assert.ok(!gallery.includes(".hero-photo:not(.hero-video)"));
 assert.ok(galleryBuilder.includes('/assets/hello-sea-main.mp4'));
 assert.ok(css.includes('.hero-main-video'));
});

test('Photos page uses HELLO SEA first-party images and playable video moments',()=>{
 const media=JSON.parse(read('public/gallery.json'));
 assert.equal(media.length,6);
 assert.equal(media.filter(item=>item.kind==='video').length,4);
 for(const item of media.filter(item=>item.kind==='video')){
  assert.ok(existsSync(new URL(`../public${item.src}`,import.meta.url)));
  assert.ok(existsSync(new URL(`../public${item.poster}`,import.meta.url)));
 }
 assert.ok(template.includes('id="photo-media"'));
 assert.ok(template.includes('data-media-kind="video"'));
 assert.ok(gallery.includes('video.controls=true'));
 assert.ok(gallery.includes("video.preload='metadata'"));
 assert.ok(css.includes('.photo-play'));
 assert.ok(i18n.includes('HELLO SEA LOMBOK이 그루뿍에서 직접 촬영'));
});

test('Yudha profile uses three clickable photos with a full-size viewer',()=>{
 for(const id of ['01-9283','02-1905','03-0000']){
  assert.ok(teamJs.includes(`/assets/team/yudha-${id}-thumb.jpg`));
  assert.ok(teamJs.includes(`/assets/team/yudha-${id}-full.jpg`));
  assert.ok(existsSync(new URL(`../public/assets/team/yudha-${id}-thumb.jpg`,import.meta.url)));
  assert.ok(existsSync(new URL(`../public/assets/team/yudha-${id}-full.jpg`,import.meta.url)));
 }
 assert.ok(teamJs.includes("Yudha:["));
 assert.ok(teamJs.includes("'team-triptych'"));
 assert.ok(teamJs.includes('dialog.showModal()'));
 assert.ok(teamJs.includes("event.key==='ArrowLeft'"));
 assert.ok(teamJs.includes("event.key==='ArrowRight'"));
 assert.ok(css.includes('.team-photo-dialog'));
 assert.ok(css.includes('.team-triptych'));
});

test('Review page prepares honest multilingual Google Maps reviews without uploading media',()=>{
 assert.ok(template.includes('href="/review" data-page-link="review"'));
 assert.ok(template.includes('data-page-panel="review"'));
 assert.ok(template.includes('id="review-original"'));
 assert.ok(template.includes('id="review-english"'));
 assert.ok(template.includes('accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"'));
 assert.ok(template.includes('data-review-url=""'));
 assert.ok(reviewJs.includes("new URL('https://translate.google.com/')"));
 assert.ok(reviewJs.includes('URL.createObjectURL(file)'));
 assert.ok(reviewJs.includes('new DataTransfer()'));
 assert.ok(!reviewJs.includes("fetch("));
 assert.ok(css.includes('.review-media-preview'));
 assert.ok(template.includes('"@type":"SportsActivityLocation"'));
 assert.ok(robots.includes('Sitemap: https://hellosealombok.com/sitemap.xml'));
 assert.ok(sitemap.includes('<loc>https://hellosealombok.com/review</loc>'));
 const security=JSON.stringify(vercel);
 assert.ok(security.includes("img-src 'self' data: blob:"));
 assert.ok(security.includes("media-src 'self' blob:"));
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
 for(const route of ['/our-story','/goods','/ayo-surf','/photos','/q-and-a','/review','/booking-inquiry'])assert.ok(app.includes(route));
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
 for(const id of ['sticker-pado-a','sticker-pado-b','sticker-wordmark','sticker-logo-lockup'])assert.ok(sticker.includes(`id="${id}"`));
 assert.ok(!sticker.includes('sticker-mini'));
});

test('Board-only rental FAQ stays removed until rental inventory is ready',()=>{
 assert.ok(!template.includes('faqQ10'));
 assert.ok(!template.includes('faqA10'));
 assert.ok(!i18n.includes('faqQ10'));
 assert.ok(!i18n.includes('faqA10'));
 assert.ok(!/rent a board without a lesson|수업 없이 보드만 대여|レッスンなしでボードだけレンタル/.test(template+i18n));
});
