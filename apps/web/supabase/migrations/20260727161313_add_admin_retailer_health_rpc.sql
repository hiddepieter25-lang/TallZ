create or replace function public.admin_list_retailer_health(p_password text)
returns table (
  retailer_id uuid,
  name text,
  last_synced timestamptz,
  product_count bigint,
  photo_pct numeric,
  complete_pct numeric
)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if p_password is distinct from '__ADMIN_PASSWORD__' then
    raise exception 'invalid admin password' using errcode = '28000';
  end if;
  return query
    select
      r.id as retailer_id,
      r.name,
      (
        select max(j.run_at)
        from public.ingestion_jobs j
        where j.retailer_id = r.id and j.status = 'success'
      ) as last_synced,
      count(p.id) as product_count,
      coalesce(
        round(100.0 * count(p.id) filter (
          where exists (select 1 from public.product_images pi where pi.product_id = p.id)
        ) / nullif(count(p.id), 0), 0),
        0
      ) as photo_pct,
      coalesce(
        round(100.0 * count(p.id) filter (
          where p.color is not null and p.material is not null and p.pattern is not null
        ) / nullif(count(p.id), 0), 0),
        0
      ) as complete_pct
    from public.retailers r
    left join public.products p on p.retailer_id = r.id and p.active = true
    group by r.id, r.name
    order by r.name;
end;
$$;
