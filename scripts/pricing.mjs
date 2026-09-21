import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../public/',import.meta.url);
const plans=JSON.parse(await readFile(new URL('pricing.json',root),'utf8'));
const path=new URL('index.html',root),html=await readFile(path,'utf8');
await writeFile(path,html.replace(/(<script id="pricing-data" type="application\/json">)[\s\S]*?(<\/script>)/,(_,a,b)=>a+JSON.stringify(plans).replace(/</g,'\\u003c')+b));
