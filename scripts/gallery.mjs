import {readFile,writeFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const photos=JSON.parse(await readFile(`${root}public/gallery.json`,'utf8'));
if(!Array.isArray(photos)||!photos.length)throw new Error('Add at least one licensed photo to gallery.json.');
const ids=new Set();
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const photo of photos){
 if(!/^[a-z0-9-]+$/.test(photo.id)||ids.has(photo.id))throw new Error('Photo IDs must be unique lowercase slugs.');ids.add(photo.id);
 if(!/^\/assets\/photos\/[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp)$/.test(photo.src))throw new Error('Use a local photo path.');
 await access(`${root}public${photo.src}`);
 if(!['scenery','surf'].includes(photo.category))throw new Error('Unknown photo category.');
 for(const key of ['title','location','alt'])for(const lang of ['en','ko','ja'])if(!photo[key]?.[lang])throw new Error(`Missing ${key}/${lang} for ${photo.id}`);
 for(const key of ['author','license','licenseUrl','source','changes','date'])if(!photo[key])throw new Error(`Missing ${key} for ${photo.id}`);
 for(const key of ['source','licenseUrl'])if(new URL(photo[key]).protocol!=='https:')throw new Error('Credit links must use HTTPS.');
 if(!(photo.width>0&&photo.height>0))throw new Error('Photo dimensions are required.');
}
const credit=p=>`${esc(p.author)} · <a href="${esc(p.source)}" target="_blank" rel="noopener noreferrer" data-i18n="photoSource">Source</a> · <a href="${esc(p.licenseUrl)}" target="_blank" rel="license noopener noreferrer">${esc(p.license)}</a>`;
const image=(p,props='')=>`<img src="${esc(p.src)}" width="${p.width}" height="${p.height}" alt="${esc(p.alt.en)}" data-photo-alt="${p.id}" ${props}>`;
const cards=photos.map(p=>`<figure class="gallery-card" data-category="${p.category}" data-photo-id="${p.id}"><button class="photo-open" type="button" data-open-photo="${p.id}" aria-label="View photo: ${esc(p.title.en)}">${image(p,'loading="lazy" decoding="async"')}<span class="photo-expand" aria-hidden="true">↗</span></button><figcaption><p class="photo-place" data-photo-text="${p.id}:location">${esc(p.location.en)}</p><h3 data-photo-text="${p.id}:title">${esc(p.title.en)}</h3><p class="photo-attribution">${credit(p)}</p></figcaption></figure>`).join('\n');
const featured=photos.find(p=>p.featured)||photos[0];
const hero=`<figure class="hero-photo"><button type="button" class="photo-open" data-open-photo="${featured.id}" aria-label="View photo: ${esc(featured.title.en)}">${image(featured,'fetchpriority="high"')}<span class="photo-expand" aria-hidden="true">↗</span></button><figcaption><span class="photo-place" data-photo-text="${featured.id}:location">${esc(featured.location.en)}</span><span class="photo-attribution">${credit(featured)}</span></figcaption></figure>`;
let html=await readFile(`${root}public/index.html`,'utf8');
function replace(start,end,body){const pattern=new RegExp(`<!-- ${start} -->[\\s\\S]*?<!-- ${end} -->`);if(!pattern.test(html))throw new Error(`Missing ${start}`);html=html.replace(pattern,`<!-- ${start} -->\n${body}\n<!-- ${end} -->`);}
replace('HERO-PHOTO-START','HERO-PHOTO-END',hero);
replace('GALLERY-START','GALLERY-END',cards);
replace('CREDITS-START','CREDITS-END',photos.map(p=>`<p><strong>${esc(p.originalTitle||p.title.en)}</strong><br>${credit(p)}</p>`).join('\n'));
html=html.replace(/<script id="gallery-data" type="application\/json">[\s\S]*?<\/script>/g,'');
html=html.replace('</body>',`<script id="gallery-data" type="application/json">${JSON.stringify(photos).replace(/</g,'\\u003c')}</script></body>`);
await writeFile(`${root}public/index.html`,html);
console.log(`Built ${photos.length} gallery entries with credits.`);
