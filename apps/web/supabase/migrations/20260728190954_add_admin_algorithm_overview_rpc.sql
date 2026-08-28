create or replace function public.admin_algorithm_overview(p_password text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  result jsonb;
begin
  if p_password is distinct from '__ADMIN_PASSWORD__' then
    raise exception 'invalid admin password' using errcode = '28000';
  end if;

  select jsonb_build_object(
    'signal_counts', (
      select coalesce(jsonb_agg(jsonb_build_object('signal_type', signal_type, 'count', cnt) order by cnt desc), '[]'::jsonb)
      from (select signal_type, count(*) as cnt from product_events group by signal_type) s
    ),
    'placement_counts', (
      select coalesce(jsonb_agg(jsonb_build_object('placement', placement, 'count', cnt) order by cnt desc), '[]'::jsonb)
      from (select placement, count(*) as cnt from product_events group by placement) p
    ),
    'avg_dwell_by_placement', (
      select coalesce(jsonb_agg(jsonb_build_object('placement', placement, 'avg_dwell_ms', round(avg_dwell)) order by avg_dwell desc), '[]'::jsonb)
      from (
        select placement, avg(dwell_ms) as avg_dwell
        from product_events
        where signal_type = 'impression' and dwell_ms is not null
        group by placement
      ) d
    ),
    'style_tag_counts', (
      select coalesce(jsonb_agg(jsonb_build_object('tag', tag, 'count', cnt) order by cnt desc), '[]'::jsonb)
      from (
        select unnest(p.style_tags) as tag, count(*) as cnt
        from product_events pe
        join products p on p.id = pe.product_id
        where pe.signal_type = 'save'
        group by tag
      ) t
    ),
    'total_events', (select count(*) from product_events),
    'total_users_with_signal', (select count(distinct user_id) from product_events where user_id is not null)
  ) into result;

  return result;
end;
$$;
