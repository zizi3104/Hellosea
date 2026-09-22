import {getPrices} from '../lib/management.js';
import { createHmac } from 'node:crypto';
import { configured, allowedOrigins } from '../lib/config.js';
import { validateInquiry } from '../lib/validation.js';
export default async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({ error:'Method not allowed.' }); }
  if (!allowedOrigins().has(req.headers.origin)) return res.status(403).json({ error:'Please send your inquiry from the HELLO SEA website.' });
  if (!(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return res.status(415).json({ error:'Please use the inquiry form.' });
  if (Number(req.headers['content-length'] || 0) > 12000) return res.status(413).json({ error:'Your inquiry is too long.' });
  let body = req.body;
  try { if (typeof body === 'string') body = JSON.parse(body); if (Buffer.byteLength(JSON.stringify(body) || '') > 12000) return res.status(413).json({ error:'Your inquiry is too long.' }); }
  catch { return res.status(400).json({ error:'Please check your inquiry details.' }); }
  let prices;try { prices=await getPrices(); if(!prices)throw Error(); } catch {return res.status(503).json({error:'Prices are temporarily unavailable. Please try again.'});}
  const checked = validateInquiry(body,new Date(),prices);
  if (checked.error) return res.status(400).json({ error:checked.error });
  if (!configured()) return res.status(503).json({ error:'Online inquiries are not open yet. Please try again later.' });
  // Vercel overwrites x-vercel-forwarded-for. Do not trust user-controlled generic forwarded headers.
  const ip = process.env.VERCEL ? String(req.headers['x-vercel-forwarded-for'] || 'unknown').split(',')[0].trim() : (req.socket?.remoteAddress || 'local');
  const rateKey = createHmac('sha256', process.env.RATE_LIMIT_SECRET).update(ip).digest('hex');
  try {
    const base = process.env.SUPABASE_URL.replace(/\/$/,'');
    const response = await fetch(`${base}/rest/v1/rpc/submit_surf_inquiry`, {
      method:'POST', headers:{ 'Content-Type':'application/json', apikey:process.env.SUPABASE_SECRET_KEY },
      body:JSON.stringify({ payload:checked.value, client_hash:rateKey }), signal:AbortSignal.timeout(10000)
    });
    if (!response.ok) return res.status(503).json({ error:'We couldn’t save your inquiry right now. Please try again.' });
    const result = await response.json();
    if (result?.status === 'limited') { res.setHeader('Retry-After','3600'); return res.status(429).json({ error:'You’ve sent several inquiries. Please try again in an hour.' }); }
    if (result?.status !== 'accepted') return res.status(503).json({ error:'We couldn’t confirm your inquiry. Please try again.' });
    return res.status(201).json({ ok:true });
  } catch { return res.status(503).json({ error:'We couldn’t confirm delivery. Please try again — duplicate inquiries are prevented.' }); }
}
