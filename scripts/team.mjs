import {readFile,writeFile} from 'node:fs/promises';
const publicRoot=new URL('../public/',import.meta.url);
const data=JSON.parse(await readFile(new URL('team.json',publicRoot),'utf8'));
if(data.people.length!==2)throw Error('Two team profiles are required');
for(const locale of ['en','ko','ja']){
 if(!data.intro[locale]?.trim())throw Error(`Missing school introduction: ${locale}`);
 for(const person of data.people){
  if(!person.name?.trim()||!person.bio[locale]?.trim())throw Error(`Missing team profile: ${locale}`);
  if(person.photo&&!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(person.photo))throw Error('Team photos must be embedded JPG, PNG or WebP images');
 }
}
const path=new URL('index.html',publicRoot);
const html=await readFile(path,'utf8');
await writeFile(path,html.replace(/(<script id="team-data" type="application\/json">)[\s\S]*?(<\/script>)/,(_,a,b)=>a+JSON.stringify(data).replace(/</g,'\\u003c')+b));
