alter table public.onboarding_responses
  add column occasions text[] not null default '{}',
  add column proportion text,
  add column fit_preference text,
  add column budget text;
