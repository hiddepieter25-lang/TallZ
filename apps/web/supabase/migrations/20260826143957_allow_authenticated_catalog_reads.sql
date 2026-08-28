-- The catalog read policies were scoped to the `anon` role only. That worked
-- while the only consumer was the website, which rendered products with a
-- session-less client. The mobile app uses one session-aware client, so every
-- signed-in user runs as `authenticated` and got zero rows back — the feed,
-- search and explore all rendered empty.
--
-- These are public catalog data. Grant the same read to `authenticated`.
-- The retailers condition is unchanged: pending/rejected retailers stay hidden.

drop policy if exists "public can read products" on public.products;
create policy "public can read products"
  on public.products for select
  to anon, authenticated
  using (true);

drop policy if exists "public can read product_images" on public.product_images;
create policy "public can read product_images"
  on public.product_images for select
  to anon, authenticated
  using (true);

drop policy if exists "public can read approved retailers" on public.retailers;
create policy "public can read approved retailers"
  on public.retailers for select
  to anon, authenticated
  using (status = 'approved');
