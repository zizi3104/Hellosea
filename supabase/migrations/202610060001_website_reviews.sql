begin;

create table public.website_reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  display_name text check (display_name is null or char_length(display_name) between 1 and 60),
  body text not null check (char_length(body) between 10 and 2500),
  body_en text check (body_en is null or char_length(body_en) <= 2500),
  locale text not null check (locale in ('en','ko','ja')),
  media_count integer not null default 0 check (media_count between 0 and 5),
  consent boolean not null check (consent = true),
  privacy_version text not null,
  status text not null default 'pending' check (status in ('uploading','pending','published','rejected'))
);

create table public.website_review_media (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.website_reviews(id) on delete cascade,
  sort_order integer not null check (sort_order between 0 and 4),
  original_path text not null unique check (char_length(original_path) <= 300),
  preview_path text not null unique check (char_length(preview_path) <= 300),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  original_size integer not null check (original_size between 1 and 10485760),
  preview_size integer not null check (preview_size between 1 and 2097152),
  width integer not null check (width between 1 and 12000),
  height integer not null check (height between 1 and 12000),
  upload_complete boolean not null default false,
  unique(review_id,sort_order)
);

create table public.website_review_rate_limits (
  client_hash text primary key,
  window_start timestamptz not null,
  request_count integer not null check (request_count >= 0)
);

create index website_reviews_public_order on public.website_reviews(status,published_at desc);
create index website_reviews_pending_order on public.website_reviews(status,created_at desc);
create index website_review_media_review on public.website_review_media(review_id,sort_order);

alter table public.website_reviews enable row level security;
alter table public.website_review_media enable row level security;
alter table public.website_review_rate_limits enable row level security;
revoke all on public.website_reviews, public.website_review_media, public.website_review_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.website_reviews, public.website_review_media, public.website_review_rate_limits to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('website-reviews','website-reviews',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create or replace function public.submit_website_review(payload jsonb, client_hash text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  rate public.website_review_rate_limits%rowtype;
  review_uuid uuid;
  media_total integer;
begin
  if client_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid client hash'; end if;
  perform pg_advisory_xact_lock(hashtextextended(payload->>'request_id', 0));
  select id into review_uuid from public.website_reviews where request_id=(payload->>'request_id')::uuid;
  if review_uuid is not null then return jsonb_build_object('status','accepted','review_id',review_uuid); end if;
  delete from public.website_review_rate_limits where window_start < now() - interval '24 hours';
  insert into public.website_review_rate_limits values(client_hash,now(),0) on conflict do nothing;
  select * into rate from public.website_review_rate_limits r where r.client_hash=submit_website_review.client_hash for update;
  if rate.window_start < now() - interval '1 hour' then
    update public.website_review_rate_limits r set window_start=now(),request_count=0 where r.client_hash=submit_website_review.client_hash;
    rate.request_count:=0;
  end if;
  if rate.request_count>=3 then return jsonb_build_object('status','limited'); end if;
  media_total:=(payload->>'media_count')::integer;
  insert into public.website_reviews(request_id,display_name,body,body_en,locale,media_count,consent,privacy_version,status)
  values((payload->>'request_id')::uuid,nullif(btrim(payload->>'display_name'),''),payload->>'body',nullif(btrim(payload->>'body_en'),''),payload->>'locale',media_total,(payload->>'consent')::boolean,payload->>'privacy_version',case when media_total>0 then 'uploading' else 'pending' end)
  returning id into review_uuid;
  update public.website_review_rate_limits r set request_count=request_count+1 where r.client_hash=submit_website_review.client_hash;
  return jsonb_build_object('status','accepted','review_id',review_uuid);
end;
$$;
revoke all on function public.submit_website_review(jsonb,text) from public,anon,authenticated;
grant execute on function public.submit_website_review(jsonb,text) to service_role;

commit;
