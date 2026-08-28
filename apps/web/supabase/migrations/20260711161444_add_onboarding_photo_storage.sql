-- Private bucket: photos are personal style references, not public assets.
insert into storage.buckets (id, name, public)
values ('onboarding-photos', 'onboarding-photos', false)
on conflict (id) do nothing;

-- Anon (the browser client, no auth yet) can upload into this bucket only.
-- No select/update/delete policy is granted, so nothing can be read back
-- or overwritten via the public client key — matches the write-only
-- pattern used for onboarding_responses.
create policy "anon can upload onboarding photos"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'onboarding-photos');

alter table public.onboarding_responses
  rename column photo_filename to photo_path;
