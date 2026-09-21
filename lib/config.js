export function configured(env = process.env) {
  try {
    const url = new URL(env.SUPABASE_URL);
    return url.protocol === 'https:' && !!env.SUPABASE_SECRET_KEY && (env.RATE_LIMIT_SECRET || '').length >= 32;
  } catch { return false; }
}
export function allowedOrigins(env = process.env) {
  const values = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (env.VERCEL_URL) values.push(`https://${env.VERCEL_URL}`);
  if (env.NODE_ENV !== 'production' && !env.VERCEL) values.push('http://localhost:3000','http://127.0.0.1:3000');
  return new Set(values);
}
