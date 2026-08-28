create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- Height/quiz answers stay in onboarding_responses (never in profiles),
-- now optionally linked to an account instead of being anonymous-only.
alter table public.onboarding_responses
  add column user_id uuid references auth.users(id) on delete cascade;

-- Auto-create a profile row + stamp last_login_at on every login/signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, last_login_at)
  values (new.id, now())
  on conflict (user_id) do update set last_login_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
