import plans from '../public/pricing.json' with {type:'json'};
export function lombokDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Makassar', year:'numeric', month:'2-digit', day:'2-digit' }).format(now);
}
export function validateInquiry(body, now = new Date()) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error:'Please check your inquiry details.' };
  const text = key => typeof body[key] === 'string' ? body[key].trim() : '';
  const name = text('name'), email = text('email').toLowerCase(), phone = text('phone'), message = text('message'), preferredDate = text('preferredDate'), level = text('level');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text('requestId'))) return { error:'Please refresh the page and try again.' };
  if (name.length < 2 || name.length > 100 || /[\x00-\x1f]/.test(name)) return { error:'Please enter your name (2–100 characters).' };
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error:'Please enter a valid email address.' };
  if (!Number.isInteger(body.people) || body.people < 1 || body.people > 8) return { error:'Please choose 1–8 surfers. For a larger group, mention it in your message.' };
  if (!['first-time','beginner','improving','not-sure'].includes(level)) return { error:'Please choose your surfing experience.' };
  if (phone && (!/^[+0-9()\s-]{7,25}$/.test(phone) || phone.replace(/\D/g,'').length < 7 || phone.replace(/\D/g,'').length > 15)) return { error:'Please check your WhatsApp number and include the country code.' };
  if (message.length > 1800) return { error:'Please keep your message under 1,800 characters.' };
  if (preferredDate) {
    const parsed = new Date(`${preferredDate}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== preferredDate || preferredDate < lombokDate(now)) return { error:'Please choose today or a future date in Lombok.' };
    const max = new Date(now); max.setUTCFullYear(max.getUTCFullYear() + 2);
    if (preferredDate > lombokDate(max)) return { error:'Please choose a date within the next two years, or leave the date blank.' };
  }
  if (body.consent !== true) return { error:'Please agree to let us use your details to respond.' };
  if (text('website')) return { error:'Your inquiry could not be accepted.' };
  const planKey=text('planKey');
  const plan=plans.find(p=>p.id===planKey);
  if(planKey&&!plan)return {error:'Please choose a valid lesson option.'};
  const savedMessage=plan ? `[Reference only, not a quote] ${plan.title.en}: IDR ${plan.price}/person; ${body.people} surfers; total IDR ${plan.price*body.people}.\n${message}` : message;
  return { value: { request_id:text('requestId'), name, email, phone:phone || null, preferred_date:preferredDate || null, people:body.people, level, message:savedMessage || null, consent:true, privacy_version:'2026-09-21' } };
}
