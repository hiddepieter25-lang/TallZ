-- Two things the app promised and could not do.
--
-- 1. The heart. It logged a `save` event and flipped local state, and that was
--    all — nothing was stored, nothing could be listed, and a reload forgot it.
--    product_events is admin-only to read, so it was never going to be the
--    source of a user's own saved list. This is.
create table public.saved_products (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.saved_products enable row level security;

-- Own rows only, in every direction. `to authenticated` on purpose: the
-- anon-only mistake in CLAUDEMODE.md §5a returns zero rows with no error.
create policy "users can read own saved products"
  on public.saved_products for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can save products"
  on public.saved_products for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can unsave products"
  on public.saved_products for delete
  to authenticated
  using (auth.uid() = user_id);

create index saved_products_user_id_idx on public.saved_products (user_id);

-- 2. Account deletion. The website handled it with the service role on a
--    server; that server is gone. Deleting a row from auth.users needs more
--    than the caller's own rights, which is what SECURITY DEFINER is for.
--    Scoped hard to auth.uid(): a user can delete exactly one account.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  -- Explicit rather than relying on cascades alone: product_events sets
  -- user_id to null on user delete, which would keep the rows. Under GDPR
  -- the rows can stay once anonymised, but deleting is the safer default.
  delete from public.product_events where user_id = v_user;
  delete from public.saved_products where user_id = v_user;
  delete from public.onboarding_responses where user_id = v_user;
  delete from public.profiles where user_id = v_user;
  delete from auth.users where id = v_user;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
