create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = user_id);

create policy "Users can delete own onboarding responses"
  on public.onboarding_responses for delete
  using (auth.uid() = user_id);

create policy "Users can delete own product events"
  on public.product_events for delete
  using (auth.uid() = user_id);
