create table public.site_content (
 id text primary key check (id = 'team'),
 content jsonb not null,
 revision bigint not null default 1,
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id) on delete set null
);
alter table public.site_content enable row level security;
revoke all on public.site_content from public, anon, authenticated;
grant select, insert, update on public.site_content to service_role;
create function public.save_team_content(payload jsonb, expected_revision bigint, editor uuid)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare next_revision bigint;
begin
 perform pg_advisory_xact_lock(890721002);
 if exists(select 1 from site_content where id='team') then
  update site_content set content=payload, revision=revision+1, updated_at=now(), updated_by=editor
  where id='team' and revision=expected_revision returning revision into next_revision;
  if next_revision is null then return jsonb_build_object('status','conflict'); end if;
 else
  if expected_revision<>0 then return jsonb_build_object('status','conflict'); end if;
  insert into site_content(id,content,updated_by) values('team',payload,editor) returning revision into next_revision;
 end if;
 return jsonb_build_object('status','saved','revision',next_revision);
end; $$;
revoke all on function public.save_team_content(jsonb,bigint,uuid) from public, anon, authenticated;
grant execute on function public.save_team_content(jsonb,bigint,uuid) to service_role;
