-- The app ranks the home page's four picks by popularity, but product_events
-- is readable only by admins (`is_admin()`), and RLS returns zero rows rather
-- than an error — so querying it from the app would silently produce nothing.
-- See CLAUDEMODE.md §5a for the same trap costing a week twice already.
--
-- This exposes the aggregate and nothing else: one count per product. No user
-- ids, no timestamps, no individual rows. That a product was saved four times
-- says nothing about who saved it, so it is safe under the public key.
--
-- `save` counts double: bookmarking something is a stronger signal of intent
-- than tapping through to the shop, which people also do out of curiosity.
create or replace function public.top_products(p_limit int default 12)
returns table (product_id uuid, score bigint)
language sql
security definer
set search_path = public
as $$
  select e.product_id,
         (count(*) filter (where e.signal_type = 'save') * 2
          + count(*) filter (where e.signal_type = 'click'))::bigint as score
  from public.product_events e
  join public.products p on p.id = e.product_id
  where e.product_id is not null
    and e.signal_type in ('click', 'save')
    and p.active
  group by e.product_id
  -- product_id as the tiebreak keeps the order stable between calls, so the
  -- home page doesn't reshuffle equally-scored items on every refresh.
  order by score desc, e.product_id
  limit least(greatest(p_limit, 0), 100);
$$;

revoke all on function public.top_products(int) from public;
grant execute on function public.top_products(int) to anon, authenticated;
