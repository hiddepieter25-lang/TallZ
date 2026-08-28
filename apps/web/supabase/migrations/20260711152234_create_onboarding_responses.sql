create table public.onboarding_responses (
  id uuid primary key default gen_random_uuid(),
  height_range text not null,
  styles text[] not null default '{}',
  photo_filename text,
  created_at timestamptz not null default now()
);

alter table public.onboarding_responses enable row level security;

-- Client (anon key) can record a new onboarding response but cannot
-- read back any rows, including its own or others' — this is a
-- write-only intake table, not a user-facing data source.
create policy "anon can insert onboarding responses"
  on public.onboarding_responses
  for insert
  to anon
  with check (true);
