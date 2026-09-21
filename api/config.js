import { configured } from '../lib/config.js';
export default function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'GET') { res.setHeader('Allow','GET'); return res.status(405).json({error:'Method not allowed.'}); }
  const phone = process.env.WHATSAPP_NUMBER || '6287861136585';
  return res.status(200).json({ inquiriesEnabled:configured(), whatsappNumber:/^\d{8,15}$/.test(phone) ? phone : null });
}
