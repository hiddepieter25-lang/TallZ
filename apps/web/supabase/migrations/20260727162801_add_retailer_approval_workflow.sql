-- Discovery writes new candidates as 'pending'; existing retailers default
-- to 'approved' so nothing already live is affected.
alter table public.retailers
  add column status text not null default 'approved'
  check (status in ('pending', 'approved', 'rejected'));

-- Public read access must only ever expose approved retailers — a pending
-- candidate hasn't been reviewed yet and shouldn't appear on the live site.
drop policy if exists "public can read retailers" on public.retailers;
create policy "public can read approved retailers"
  on public.retailers for select
  to anon
  using (status = 'approved');

-- Internal-only bookkeeping for discover-retailers.mjs so repeat runs don't
-- re-spend search/network calls on hostnames already checked and rejected.
-- No RLS policies on purpose: only the service role (used by the script)
-- should ever read or write this table.
create table public.retailer_discovery_attempts (
  hostname text primary key,
  result text not null,
  reason text,
  checked_at timestamptz not null default now()
);
alter table public.retailer_discovery_attempts enable row level security;

create or replace function public.admin_list_pending_retailers(p_password text)
returns table (id uuid, name text, website_url text, country text, region text, created_at timestamptz)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if p_password is distinct from '__ADMIN_PASSWORD__' then
    raise exception 'invalid admin password' using errcode = '28000';
  end if;
  return query
    select r.id, r.name, r.website_url, r.country, r.region, r.created_at
    from public.retailers r
    where r.status = 'pending'
    order by r.created_at desc;
end;
$$;

create or replace function public.admin_set_retailer_status(p_password text, p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if p_password is distinct from '__ADMIN_PASSWORD__' then
    raise exception 'invalid admin password' using errcode = '28000';
  end if;
  if p_status not in ('approved', 'rejected') then
    raise exception 'invalid status: %', p_status;
  end if;
  update public.retailers set status = p_status where id = p_id;
end;
$$;
