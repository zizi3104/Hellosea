export function serverHeaders(){const key=process.env.SUPABASE_SECRET_KEY;return {apikey:key,...(key?.startsWith('eyJ')?{Authorization:`Bearer ${key}`}:{})};}
export function validateTeam(value){
 if(!value||typeof value!=='object'||!Array.isArray(value.people)||value.people.length!==2||typeof value.sample!=='boolean')return null;
 const localized=(x,max)=>{if(!x||typeof x!=='object')return null;const out={};for(const l of ['en','ko','ja']){if(typeof x[l]!=='string'||!x[l].trim()||x[l].length>max)return null;out[l]=x[l].trim();}return out;};
 const intro=localized(value.intro,1200);if(!intro)return null;const people=[];
 for(const p of value.people){if(!p||typeof p.name!=='string'||!p.name.trim()||p.name.length>60)return null;const bio=localized(p.bio,1600);if(!bio||typeof p.photo!=='string'||p.photo.length>1400000)return null;
 if(p.photo){const m=p.photo.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);if(!m)return null;const b=Buffer.from(m[2],'base64');if(b.length>1024*1024||b.toString('base64')!==m[2])return null;const good=m[1]==='jpeg'?b[0]===255&&b[1]===216&&b[2]===255:m[1]==='png'?b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';if(!good)return null;}
 people.push({name:p.name.trim(),bio,photo:p.photo});}
 return {intro,people,sample:value.sample};
}
export async function db(path,options={}){return fetch(`${process.env.SUPABASE_URL.replace(/\/$/,'')}/rest/v1/${path}`,{...options,headers:{...serverHeaders(),'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(8000)});}
