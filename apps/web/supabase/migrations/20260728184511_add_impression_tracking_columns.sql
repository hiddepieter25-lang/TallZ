-- Phase 0 of the discovery-algorithm plan: groundwork for impression/dwell
-- tracking, ranker versioning, and A/B bucketing. No app behavior changes yet.

alter table public.product_events
  add column dwell_ms integer null,
  add column ranker_version text null,
  add column variant text null;

alter table public.product_events
  drop constraint product_events_signal_type_check,
  add constraint product_events_signal_type_check
    check (signal_type = any (array['click', 'save', 'ignore', 'impression']));

alter table public.product_events
  drop constraint product_events_placement_check,
  add constraint product_events_placement_check
    check (placement = any (array['feed', 'explore', 'product_card', 'onboarding_swipe']));

create index if not exists product_events_user_id_idx on public.product_events (user_id);
create index if not exists product_events_signal_type_idx on public.product_events (signal_type);
