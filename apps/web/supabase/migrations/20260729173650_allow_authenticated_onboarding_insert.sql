-- The only INSERT policy was scoped to the `anon` role, so a logged-in user
-- finishing the quiz had their write rejected by RLS — silently, since the
-- client swallows the error. Result: 24 stored responses, none attached to a
-- user. This adds the missing policy so answers can belong to an account.
--
-- Deliberately no UPDATE policy and no unique constraint on user_id: the table
-- stays append-only, re-taking the quiz inserts a new row, and every read takes
-- the newest row per user. That keeps answer history for free.
create policy "authenticated users can insert own onboarding responses"
  on public.onboarding_responses
  for insert
  to authenticated
  with check (auth.uid() = user_id);
