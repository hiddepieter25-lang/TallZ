create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  feedback_type text not null check (feedback_type in ('general', 'bug', 'suggestion', 'brand_request')),
  message text not null,
  product_id uuid references public.products(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'new' check (status in ('new', 'reviewed', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Write-only from the client — reviewed via Supabase Studio, no in-app admin UI yet.
create policy "anyone can submit feedback"
  on public.feedback for insert
  with check (true);
