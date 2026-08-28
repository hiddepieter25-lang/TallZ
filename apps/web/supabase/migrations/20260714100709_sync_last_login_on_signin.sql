create or replace function public.handle_user_sign_in()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.last_sign_in_at is distinct from old.last_sign_in_at then
    update public.profiles set last_login_at = new.last_sign_in_at where user_id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_sign_in
  after update on auth.users
  for each row execute function public.handle_user_sign_in();
