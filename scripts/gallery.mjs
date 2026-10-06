import {readFile,writeFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const media=JSON.parse(await readFile(`${root}public/gallery.json`,'utf8'));
if(!Array.isArray(media)||!media.length)throw new Error('Add at least one gallery item to gallery.json.');
const ids=new Set();
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const imagePath=s=>/^\/assets\/photos\/[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp)$/.test(s||'');
const videoPath=s=>/^\/assets\/videos\/[a-zA-Z0-9._-]+\.(mp4|webm)$/.test(s||'');
for(const item of media){
 if(!/^[a-z0-9-]+$/.test(item.id)||ids.has(item.id))throw new Error('Gallery IDs must be unique lowercase slugs.');ids.add(item.id);
 if(!['image','video'].includes(item.kind))throw new Error(`Unknown media kind for ${item.id}.`);
 if(item.kind==='image'?!imagePath(item.src):!videoPath(item.src)||!imagePath(item.poster))throw new Error(`Use approved local media paths for ${item.id}.`);
 await access(`${root}public${item.src}`);if(item.poster)await access(`${root}public${item.poster}`);
 if(!['scenery','surf'].includes(item.category))throw new Error('Unknown gallery category.');
 for(const key of ['title','location','alt'])for(const lang of ['en','ko','ja'])if(!item[key]?.[lang])throw new Error(`Missing ${key}/${lang} for ${item.id}`);
 for(const key of ['author','license','changes','date'])if(!item[key])throw new Error(`Missing ${key} for ${item.id}`);
 for(const key of ['source','licenseUrl'])if(item[key]&&new URL(item[key]).protocol!=='https:')throw new Error('Credit links must use HTTPS.');
 if(!(item.width>0&&item.height>0))throw new Error('Media dimensions are required.');
 if(item.kind==='video'&&!(item.duration>0))throw new Error('Video duration is required.');
}
if(media.filter(item=>item.featured).length!==1)throw new Error('Choose exactly one featured gallery item.');
const credit=p=>{const parts=[esc(p.author)];if(p.source)parts.push(`<a href="${esc(p.source)}" target="_blank" rel="noopener noreferrer" data-i18n="photoSource">Source</a>`);if(p.licenseUrl)parts.push(`<a href="${esc(p.licenseUrl)}" target="_blank" rel="license noopener noreferrer">${esc(p.license)}</a>`);else if(p.license)parts.push(`<span data-i18n="mediaOriginal">${esc(p.license)}</span>`);return parts.join(' · ');};
const preview=p=>`<img src="${esc(p.poster||p.src)}" width="${p.width}" height="${p.height}" alt="${esc(p.alt.en)}" data-photo-alt="${p.id}" loading="lazy" decoding="async">`;
const cards=media.map(p=>`<figure class="gallery-card" data-category="${p.category}" data-photo-id="${p.id}" data-media-kind="${p.kind}"><button class="photo-open" type="button" data-open-photo="${p.id}" aria-label="${p.kind==='video'?'Play video':'View photo'}: ${esc(p.title.en)}">${preview(p)}<span class="${p.kind==='video'?'photo-play':'photo-expand'}" aria-hidden="true">${p.kind==='video'?'▶':'↗'}</span></button><figcaption><p class="photo-place" data-photo-text="${p.id}:location">${esc(p.location.en)}</p><h3 data-photo-text="${p.id}:title">${esc(p.title.en)}</h3><p class="photo-attribution">${credit(p)}</p></figcaption></figure>`).join('\n');
const hero=`<figure class="hero-photo hero-video"><div class="hero-video-frame"><video class="hero-main-video" autoplay muted loop playsinline preload="auto" aria-label="HELLO SEA surf video in Gerupuk, Lombok"><source src="/assets/hello-sea-main.mp4" type="video/mp4"></video></div><figcaption><span class="photo-place" data-i18n="location">Gerupuk, Lombok, Indonesia</span></figcaption></figure>`;
let html=await readFile(`${root}public/index.html`,'utf8');
function replace(start,end,body){const pattern=new RegExp(`<!-- ${start} -->[\\s\\S]*?<!-- ${end} -->`);if(!pattern.test(html))throw new Error(`Missing ${start}`);html=html.replace(pattern,`<!-- ${start} -->\n${body}\n<!-- ${end} -->`);}
replace('HERO-PHOTO-START','HERO-PHOTO-END',hero);
replace('GALLERY-START','GALLERY-END',cards);
replace('CREDITS-START','CREDITS-END',media.filter(p=>p.source).map(p=>`<p><strong>${esc(p.originalTitle||p.title.en)}</strong><br>${credit(p)}</p>`).join('\n'));
html=html.replace(/<script id="gallery-data" type="application\/json">[\s\S]*?<\/script>/g,'');
html=html.replace('</body>',`<script id="gallery-data" type="application/json">${JSON.stringify(media).replace(/</g,'\\u003c')}</script></body>`);
await writeFile(`${root}public/index.html`,html);
console.log(`Built ${media.length} first-party gallery items.`);
