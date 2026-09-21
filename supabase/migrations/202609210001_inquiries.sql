begin;
create table public.surf_inquiries (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) <= 254),
  phone text,
  preferred_date date,
  people integer not null check (people between 1 and 8),
  level text not null check (level in ('first-time','beginner','improving','not-sure')),
  message text check (char_length(message) <= 2000),
  consent boolean not null check (consent = true),
  privacy_version text not null,
  status text not null default 'new' check (status in ('new','contacted','closed'))
);
create index surf_inquiries_created_at on public.surf_inquiries(created_at desc);
create table public.inquiry_rate_limits (
  client_hash text primary key,
  window_start timestamptz not null,
  request_count integer not null check (request_count >= 0)
);
alter table public.surf_inquiries enable row level security;
alter table public.inquiry_rate_limits enable row level security;
revoke all on public.surf_inquiries, public.inquiry_rate_limits from anon, authenticated;
grant select, insert, update, delete on public.surf_inquiries, public.inquiry_rate_limits to service_role;
-- Only the Vercel server can call this function. Browsers cannot read or insert rows directly.
create function public.submit_surf_inquiry(payload jsonb, client_hash text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare rate public.inquiry_rate_limits%rowtype;
begin
  if client_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid client hash'; end if;
  -- A transaction lock ensures concurrent retries with the same ID insert only once.
  perform pg_advisory_xact_lock(hashtextextended(payload->>'request_id', 0));
  if exists (select 1 from public.surf_inquiries where request_id = (payload->>'request_id')::uuid) then
    return jsonb_build_object('status','accepted');
  end if;
  -- Expired hashed identifiers are removed during new submission traffic.
  delete from public.inquiry_rate_limits where window_start < now() - interval '24 hours';
  insert into public.inquiry_rate_limits values(client_hash, now(), 0) on conflict do nothing;
  select * into rate from public.inquiry_rate_limits r where r.client_hash = submit_surf_inquiry.client_hash for update;
  if rate.window_start < now() - interval '1 hour' then
    update public.inquiry_rate_limits r set window_start = now(), request_count = 0 where r.client_hash = submit_surf_inquiry.client_hash;
    rate.request_count := 0;
  end if;
  if rate.request_count >= 5 then return jsonb_build_object('status','limited'); end if;
  insert into public.surf_inquiries(request_id, name, email, phone, preferred_date, people, level, message, consent, privacy_version)
    values ((payload->>'request_id')::uuid, payload->>'name', payload->>'email', payload->>'phone', (payload->>'preferred_date')::date,
      (payload->>'people')::integer, payload->>'level', payload->>'message', (payload->>'consent')::boolean, payload->>'privacy_version');
  update public.inquiry_rate_limits r set request_count = request_count + 1 where r.client_hash = submit_surf_inquiry.client_hash;
  return jsonb_build_object('status','accepted');
end;
$$;
revoke all on function public.submit_surf_inquiry(jsonb,text) from public, anon, authenticated;
grant execute on function public.submit_surf_inquiry(jsonb,text) to service_role;
commit;
