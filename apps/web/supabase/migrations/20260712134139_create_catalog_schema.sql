-- Catalog schema per MARKET_RESEARCH.md §4.4. Public-readable (this is a
-- browsable product catalog, unlike onboarding_responses which is
-- write-only user data). affiliate_links and ingestion_jobs are
-- operational/business data and stay unexposed to the anon key.

create table public.retailers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  clothing_type text not null,        -- 'men' | 'women' | 'unisex'
  tall_label_example text,            -- e.g. "Tall", "LT", "Big & Tall"
  tall_section_url text,
  website_url text,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references public.retailers(id) on delete cascade,
  name text not null,
  category text not null,             -- e.g. "Trousers", "Denim", "Coat"
  price_cents integer not null,
  currency text not null,             -- 'USD' | 'EUR' | 'GBP' | 'AUD'
  style_tags text[] not null default '{}',  -- app-specific discovery tags,
                                             -- not part of the research schema
  size_note text,                     -- display label, e.g. "36\" inseam", "LT"
  product_url text,                   -- outbound link to retailer
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  is_model_shot boolean not null default false,
  sort_order integer not null default 0
);

create table public.tall_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size_label text not null,           -- e.g. "Tall", "LT", "34L"
  size_system text not null,          -- e.g. "US", "UK", "EU"
  measurement_type text not null,     -- e.g. "inseam", "sleeve", "body_length"
  measurement_cm numeric not null
);

create table public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  network text not null,              -- 'cj' | 'rakuten' | 'awin' | 'direct'
  tracking_url text not null,
  commission_rate numeric,
  generated_at timestamptz not null default now()
);

create table public.ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references public.retailers(id) on delete cascade,
  source_type text not null,          -- 'affiliate_feed' | 'api' | 'manual' | 'scrape'
  status text not null,
  run_at timestamptz not null default now(),
  items_ingested integer not null default 0,
  errors text
);

alter table public.retailers enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.tall_sizes enable row level security;
alter table public.affiliate_links enable row level security;
alter table public.ingestion_jobs enable row level security;

create policy "public can read retailers" on public.retailers for select to anon using (true);
create policy "public can read products" on public.products for select to anon using (true);
create policy "public can read product_images" on public.product_images for select to anon using (true);
create policy "public can read tall_sizes" on public.tall_sizes for select to anon using (true);
-- affiliate_links and ingestion_jobs: no anon policy — not readable by the
-- frontend's public key, matching their role as internal/business data.
