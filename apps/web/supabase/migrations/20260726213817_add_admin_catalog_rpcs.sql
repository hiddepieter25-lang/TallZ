create or replace function public.admin_list_products(p_password text)
returns table (
  id uuid,
  name text,
  retailer_name text,
  category text,
  fit text,
  color text,
  material text,
  pattern text,
  gender text,
  price_cents integer,
  currency text,
  active boolean
)
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if p_password is distinct from '__ADMIN_PASSWORD__' then
    raise exception 'invalid admin password' using errcode = '28000';
  end if;
  return query
    select p.id, p.name, r.name as retailer_name, p.category, p.fit, p.color, p.material, p.pattern, p.gender, p.price_cents, p.currency, p.active
    from public.products p
    join public.retailers r on r.id = p.retailer_id
    order by p.created_at desc;
end;
$$;

grant execute on function public.admin_list_products(text) to anon, authenticated;

create or replace function public.admin_update_product(
  p_password text,
  p_id uuid,
  p_color text,
  p_material text,
  p_pattern text,
  p_gender text,
  p_category text,
  p_fit text
)
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if p_password is distinct from '__ADMIN_PASSWORD__' then
    raise exception 'invalid admin password' using errcode = '28000';
  end if;
  update public.products
  set color = nullif(p_color, ''),
      material = nullif(p_material, ''),
      pattern = nullif(p_pattern, ''),
      gender = nullif(p_gender, ''),
      category = p_category,
      fit = p_fit
  where id = p_id;
end;
$$;

grant execute on function public.admin_update_product(text, uuid, text, text, text, text, text, text) to anon, authenticated;
