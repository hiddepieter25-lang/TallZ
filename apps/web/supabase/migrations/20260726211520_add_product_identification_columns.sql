alter table public.products
  add column color text,
  add column material text,
  add column pattern text,
  add column gender text check (gender in ('men','women','unisex'));

create index products_color_idx on public.products (color);
create index products_gender_idx on public.products (gender);
