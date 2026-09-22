alter table public.site_content drop constraint if exists site_content_id_check;
alter table public.site_content add constraint site_content_id_check check(id in ('team','pricing','gallery'));
create or replace function public.save_site_section(section text,payload jsonb,expected_revision bigint,editor uuid)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare v bigint;
begin
 if section not in ('pricing','gallery') then raise exception 'Invalid section'; end if;
 perform pg_advisory_xact_lock(hashtextextended('hellosea:'||section,0));
 if exists(select 1 from site_content where id=section) then
 update site_content set content=payload,revision=revision+1,updated_at=now(),updated_by=editor where id=section and revision=expected_revision returning revision into v;
 if v is null then return jsonb_build_object('status','conflict'); end if;
 else
 if expected_revision<>0 then return jsonb_build_object('status','conflict'); end if;
 insert into site_content(id,content,updated_by) values(section,payload,editor) returning revision into v;
 end if;
 return jsonb_build_object('status','saved','revision',v);
end;$$;
revoke all on function public.save_site_section(text,jsonb,bigint,uuid) from public,anon,authenticated;
grant execute on function public.save_site_section(text,jsonb,bigint,uuid) to service_role;
create table if not exists public.surf_bookings (
 id uuid primary key default gen_random_uuid(),
 inquiry_id uuid unique references public.surf_inquiries(id) on delete set null,
 date date not null, session smallint not null check(session between 1 and 4),
 name text not null check(char_length(name) between 1 and 100),
 people integer not null check(people between 1 and 50),
 participant_names text not null default '' check(char_length(participant_names)<=2000),
 plan text not null default '' check(plan in ('','group','private','guiding','three','five')),
 time text not null default '' check(char_length(time)<=50),
 phone text not null default '' check(char_length(phone)<=100),
 notes text not null default '' check(char_length(notes)<=2000),
 status text not null default 'pending' check(status in ('pending','confirmed','completed','cancelled')),
 revision bigint not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id) on delete set null
);
create index if not exists surf_bookings_date_idx on public.surf_bookings(date,session);
alter table public.surf_bookings enable row level security;
revoke all on public.surf_bookings from public,anon,authenticated;
grant select,insert,update on public.surf_bookings to service_role;
create or replace function public.save_surf_booking(payload jsonb,expected_revision bigint,editor uuid)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare b public.surf_bookings; k uuid := (payload->>'id')::uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended('booking:'||k::text,0));
 if exists(select 1 from surf_bookings where id=k) then
 update surf_bookings set date=(payload->>'date')::date,session=(payload->>'session')::smallint,name=payload->>'name',people=(payload->>'people')::int,participant_names=payload->>'participant_names',plan=payload->>'plan',time=payload->>'time',phone=payload->>'phone',notes=payload->>'notes',status=payload->>'status',revision=revision+1,updated_at=now(),updated_by=editor
 where id=k and revision=expected_revision returning * into b;
 if b.id is null then return jsonb_build_object('status','conflict'); end if;
 else
 if expected_revision<>0 then return jsonb_build_object('status','conflict'); end if;
 insert into surf_bookings(id,inquiry_id,date,session,name,people,participant_names,plan,time,phone,notes,status,updated_by)
 values(k,nullif(payload->>'inquiry_id','')::uuid,(payload->>'date')::date,(payload->>'session')::smallint,payload->>'name',(payload->>'people')::int,payload->>'participant_names',payload->>'plan',payload->>'time',payload->>'phone',payload->>'notes',payload->>'status',editor) returning * into b;
 end if;
 if b.inquiry_id is not null then update surf_inquiries set status=case when b.status in ('completed','cancelled') then 'closed' else 'contacted' end where id=b.inquiry_id;end if;
 return jsonb_build_object('status','saved','booking',to_jsonb(b));
 exception when unique_violation then return jsonb_build_object('status','duplicate');
end;$$;
revoke all on function public.save_surf_booking(jsonb,bigint,uuid) from public,anon,authenticated;
grant execute on function public.save_surf_booking(jsonb,bigint,uuid) to service_role;
grant select,update on public.surf_inquiries to service_role;
