create table public.admins (email text primary key);
insert into public.admins (email) values ('hiddepieter25@gmail.com');

alter table public.admins enable row level security;
-- No policies on admins itself — only touched via the security-definer
-- function below, so it stays fully locked to direct client queries.

create or replace function public.is_admin()
returns boolean
language sql security definer set search_path = public
as $$
  select exists (select 1 from public.admins where email = auth.jwt() ->> 'email');
$$;

create policy "admins can read feedback"
  on public.feedback for select
  using (public.is_admin());

create policy "admins can update feedback"
  on public.feedback for update
  using (public.is_admin());

create policy "admins can read product events"
  on public.product_events for select
  using (public.is_admin());
