alter table public.products drop constraint products_fit_check;
alter table public.products add constraint products_fit_check check (fit in ('slim','relaxed','baggy','regular'));

-- Split out the genuinely oversized/boxy items from the broader "relaxed"
-- bucket now that "baggy" is its own fit tier.
update public.products set fit = 'baggy' where id in (
  select p.id from public.products p
  where p.fit = 'relaxed' and (p.name ilike '%oversized%' or p.name ilike '%boxy%')
);
