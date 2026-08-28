create table public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  product_id uuid references public.products(id) on delete cascade,
  retailer_id uuid references public.retailers(id) on delete cascade,
  signal_type text not null check (signal_type in ('click', 'save', 'ignore')),
  placement text not null check (placement in ('feed', 'explore', 'product_card')),
  link_url text,
  created_at timestamptz not null default now()
);

alter table public.product_events enable row level security;

-- Write-only from the client, like onboarding_responses — anyone (including
-- anonymous visitors) can log an event, nobody can read them back except
-- via Supabase Studio (service role bypasses RLS).
create policy "anon can insert product events"
  on public.product_events for insert
  with check (true);

create index product_events_product_id_idx on public.product_events (product_id);
create index product_events_created_at_idx on public.product_events (created_at);
