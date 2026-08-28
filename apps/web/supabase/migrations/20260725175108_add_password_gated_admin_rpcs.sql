-- Password-gated admin data access, independent of Supabase Auth logins.
-- Each function checks the password itself (server-side, inside Postgres)
-- before touching any row, so it's safe to expose via the public anon key —
-- knowing the function name alone doesn't get you data, only the password does.
-- The password is intentionally duplicated here and in the app's env var
-- (ADMIN_DASHBOARD_PASSWORD) rather than sourced from one place, since there's
-- no shared config layer between the two — keep them in sync if it's ever changed.

create or replace function public.admin_list_feedback(p_password text)
returns setof public.feedback
language plpgsql security definer set search_path = public
as $$
begin
  if p_password is distinct from '__ADMIN_PASSWORD__' then
    raise exception 'invalid admin password' using errcode = '28000';
  end if;
  return query select * from public.feedback order by created_at desc;
end;
$$;

create or replace function public.admin_update_feedback_status(p_password text, p_id uuid, p_status text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_password is distinct from '__ADMIN_PASSWORD__' then
    raise exception 'invalid admin password' using errcode = '28000';
  end if;
  update public.feedback set status = p_status where id = p_id;
end;
$$;

create or replace function public.admin_list_product_events(p_password text)
returns table(signal_type text, placement text, created_at timestamptz, product_name text, retailer_name text)
language plpgsql security definer set search_path = public
as $$
begin
  if p_password is distinct from '__ADMIN_PASSWORD__' then
    raise exception 'invalid admin password' using errcode = '28000';
  end if;
  return query
    select pe.signal_type, pe.placement, pe.created_at, p.name, r.name
    from public.product_events pe
    left join public.products p on p.id = pe.product_id
    left join public.retailers r on r.id = pe.retailer_id
    order by pe.created_at desc
    limit 2000;
end;
$$;

grant execute on function public.admin_list_feedback(text) to anon, authenticated;
grant execute on function public.admin_update_feedback_status(text, uuid, text) to anon, authenticated;
grant execute on function public.admin_list_product_events(text) to anon, authenticated;
