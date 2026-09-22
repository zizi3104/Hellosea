await import('./pricing.mjs');
await import('./team.mjs');
await import('./gallery.mjs');
import { cp, mkdir, readFile, rm, access, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { customerPages, renderCustomerPage } from './pages.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
await access(`${root}public/assets/mascot-b.svg`);
const html = await readFile(`${root}public/index.html`,'utf8');
const pageRoutes=new Set(customerPages.map(page=>page.path));
for (const match of html.matchAll(/(?:src|href)="(\/[^"#?]*)/g)) if(!pageRoutes.has(match[1]))await access(`${root}public${match[1]}`);
await rm(`${root}dist`,{recursive:true,force:true});
await mkdir(`${root}dist`,{recursive:true});
await cp(`${root}public`,`${root}dist`,{recursive:true});
for(const page of customerPages){const output=`${root}dist/${page.output}`;await mkdir(output.slice(0,output.lastIndexOf('/')),{recursive:true});await writeFile(output,renderCustomerPage(html,page));}
console.log(`HELLO SEA frontend built with ${customerPages.length} customer pages. Vercel deploys api/ as server functions.`);
