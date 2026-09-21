await import('./pricing.mjs');
await import('./team.mjs');
await import('./gallery.mjs');
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
let html = await readFile(`${root}public/index.html`, 'utf8');
const css = await readFile(`${root}public/styles.css`, 'utf8');
let js = await readFile(`${root}public/app.js`, 'utf8');
const team = await readFile(`${root}public/team.js`, 'utf8');
const pricing = await readFile(`${root}public/pricing.js`, 'utf8');
const gallery = await readFile(`${root}public/gallery.js`, 'utf8');
const i18n = await readFile(`${root}public/i18n.js`, 'utf8');
html = html.replace('<html lang="en">', '<html lang="en" data-preview="true">');
html = html.replace('<link rel="stylesheet" href="/styles.css">', `<style>${css}</style>`).replace(/<script src="\/(?:app|i18n|gallery|team|pricing)\.js" defer(?:="defer")?><\/script>/g, '');
for (const path of new Set([...html.matchAll(/(?:src|href)="(\/(?:assets\/[^" ]+|favicon.svg))"/g)].map(m => m[1]))) {
 const mime = path.endsWith('.svg') ? 'image/svg+xml' : /\.jpe?g$/i.test(path) ? 'image/jpeg' : path.endsWith('.webp') ? 'image/webp' : 'image/png';
 const data = (await readFile(`${root}public${path}`)).toString('base64');
 html = html.replaceAll(path, `data:${mime};base64,${data}`);
}
html = html.replaceAll('href="/"', 'href="#main"').replace('</body>', `<script>${i18n}</script><script>${js}</script><script>${gallery}</script><script>${team}</script><script>${pricing}</script></body>`);
await writeFile(`${root}../hellosea-preview.html`, html);
console.log('Created standalone hellosea-preview.html with approved A/B originals.');
let admin = await readFile(`${root}public/admin.html`, 'utf8');
admin = admin.replace('<html lang="ko">','<html lang="ko" data-preview="true">')
 .replace('<link rel="stylesheet" href="/admin.css">',`<style>${await readFile(`${root}public/admin.css`,'utf8')}</style>`)
 .replace('<script src="/admin.js" defer></script>','')
 .replaceAll('href="/"','href="hellosea-preview.html"')
 .replace('</body>',`<script>${await readFile(`${root}public/admin.js`,'utf8')}</script></body>`);
await writeFile(`${root}../hellosea-admin-preview.html`,admin);
console.log('Created separate admin login preview. Authentication requires a configured server.');
