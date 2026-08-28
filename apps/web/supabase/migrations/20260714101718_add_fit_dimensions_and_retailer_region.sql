alter table public.products
  add column inseam_cm numeric,
  add column sleeve_cm numeric,
  add column body_length_cm numeric,
  add column fit_notes text;

alter table public.retailers
  add column region text,
  add column shipping_countries text[] not null default '{}',
  add column size_system text;
