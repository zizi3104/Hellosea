import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import manage from '../api/manage.js';
import inquiries from '../api/inquiries.js';
import config from '../api/config.js';
import auth from '../api/auth.js';
import content from '../api/content.js';
const root = fileURLToPath(new URL('../public/', import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.json':'application/json'};
const server = createServer(async(req,res) => {
  const pathname = new URL(req.url,'http://localhost').pathname;
  res.status = code => { res.statusCode=code; return res; };
  res.json = value => { res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(value)); };
  if(pathname.startsWith('/api/')) {
    const parts=[]; let length=0;
    for await(const chunk of req) { length+=chunk.length; if(length>(['/api/content','/api/manage'].includes(pathname)?2900000:12000)) { res.status(413).json({error:'Your inquiry is too long.'}); return; } parts.push(chunk); }
    req.body=Buffer.concat(parts).toString() || undefined;
    if(pathname==='/api/manage') return manage(req,res);
    if(pathname==='/api/auth') return auth(req,res);
    if(pathname==='/api/content') return content(req,res);
    if(pathname==='/api/config') return config(req,res);
    if(pathname==='/api/inquiries') return inquiries(req,res);
    return res.status(404).json({error:'Not found.'});
  }
  if(!['GET','HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
  try {
    const path=resolve(root,`.${decodeURIComponent(pathname==='/'?'/index.html':pathname==='/admin'||pathname==='/admin/'?'/admin.html':pathname)}`);
    if(!path.startsWith(root)) { res.writeHead(403); return res.end(); }
    const data=await readFile(path); res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream'}); res.end(req.method==='HEAD'?undefined:data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(3000,'0.0.0.0',()=>console.log('HELLO SEA development server: http://localhost:3000'));
