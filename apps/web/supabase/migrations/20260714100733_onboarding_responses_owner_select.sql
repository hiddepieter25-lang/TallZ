create policy "Users can view own onboarding responses"
  on public.onboarding_responses for select
  using (auth.uid() = user_id);
