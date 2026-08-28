create extension if not exists http with schema extensions;

-- Ingest one page of a Shopify store's /products.json into the catalog.
-- Ports the tall-classification logic from the shopify-tall-ingest skill:
-- structured-field matching first (product_type, tags, variant options),
-- title-only matches marked low confidence and inserted as inactive.
create or replace function public.ingest_shopify_page(
  p_store text,
  p_page int,
  p_currency text,
  p_size_system text,
  p_retailer_name text default null,
  p_country text default null,
  p_clothing_type text default null,
  p_cap int default 500
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_resp extensions.http_response;
  v_json jsonb;
  v_prod jsonb;
  v_retailer_id uuid;
  v_host text;
  v_seen int := 0; v_tall int := 0; v_ins int := 0; v_dup int := 0;
  v_not_tall int := 0; v_gift int := 0; v_soldout int := 0;
  v_lowconf int := 0; v_capped int := 0;
  v_existing int;
  v_title text; v_ptype text; v_body text;
  v_is_tall bool; v_conf text;
  v_price numeric; v_url text; v_pid uuid;
  v_cat text; v_sizelabel text;
  v_mtype text; v_mcm numeric; v_rawm text;
  v_structs text[]; v_tags text[]; v_labels text[]; v_styles text[];
  v_s text; v_avail bool;
  v_img jsonb; v_i int;
  m text[];
begin
  v_host := split_part(regexp_replace(regexp_replace(p_store, '^https?://', ''), '^www\.', ''), '/', 1);

  select id into v_retailer_id from retailers
   where website_url ilike '%' || v_host || '%'
      or (p_retailer_name is not null and lower(name) = lower(p_retailer_name))
   limit 1;
  if v_retailer_id is null then
    insert into retailers (name, country, clothing_type, tall_label_example, website_url, tall_section_url)
    values (coalesce(p_retailer_name, v_host), coalesce(p_country, 'Unknown'),
            coalesce(p_clothing_type, 'Men & Women'), 'Tall', p_store, p_store)
    returning id into v_retailer_id;
  end if;

  select count(*) into v_existing from products where retailer_id = v_retailer_id;

  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '20000');
  select * into v_resp from extensions.http((
    'GET',
    rtrim(p_store, '/') || '/products.json?limit=250&page=' || p_page,
    array[extensions.http_header('User-Agent', 'Mozilla/5.0 (compatible; TallFitIngestBot/1.0)'),
          extensions.http_header('Accept', 'application/json')],
    null, null
  )::extensions.http_request);

  if v_resp.status <> 200 then
    return jsonb_build_object('error', 'HTTP ' || v_resp.status, 'page', p_page);
  end if;
  begin
    v_json := v_resp.content::jsonb;
  exception when others then
    return jsonb_build_object('error', 'non-JSON response', 'page', p_page);
  end;

  for v_prod in select * from jsonb_array_elements(coalesce(v_json->'products', '[]'::jsonb)) loop
    v_seen := v_seen + 1;
    v_title := coalesce(v_prod->>'title', '');
    v_ptype := coalesce(v_prod->>'product_type', '');

    if v_title ~* 'gift\s*(card|voucher)' or v_ptype ~* 'gift card' then
      v_gift := v_gift + 1; continue;
    end if;

    select bool_or(coalesce((v->>'available')::bool, false)) into v_avail
      from jsonb_array_elements(coalesce(v_prod->'variants', '[]'::jsonb)) v;
    if v_avail is false then v_soldout := v_soldout + 1; continue; end if;

    if jsonb_typeof(v_prod->'tags') = 'array' then
      v_tags := array(select btrim(x) from jsonb_array_elements_text(v_prod->'tags') x);
    elsif jsonb_typeof(v_prod->'tags') = 'string' then
      v_tags := array(select btrim(x) from unnest(string_to_array(v_prod->>'tags', ',')) x);
    else
      v_tags := '{}';
    end if;

    v_structs := array[v_ptype] || v_tags
      || coalesce(array(
           select x from jsonb_array_elements(coalesce(v_prod->'variants', '[]'::jsonb)) v,
           lateral unnest(array[v->>'option1', v->>'option2', v->>'option3']) x
           where x is not null), '{}'::text[])
      || coalesce(array(
           select jsonb_array_elements_text(o->'values')
           from jsonb_array_elements(coalesce(v_prod->'options', '[]'::jsonb)) o), '{}'::text[]);

    v_is_tall := false; v_conf := null;
    foreach v_s in array v_structs loop
      v_s := btrim(coalesce(v_s, ''));
      if v_s ~* '^\d?x{0,3}lt$|^\d?x{0,3}mt$|^xt$'
         or v_s ~* '\y3[4-9]l\y|\y40l\y'
         or v_s ~* '\ytall\y|\yextra\s*tall\y|\ybig\s*(&|and)\s*tall\y' then
        v_is_tall := true; v_conf := 'high'; exit;
      end if;
    end loop;
    if not v_is_tall and v_title ~* '\ytall\y' then
      v_is_tall := true; v_conf := 'low';
    end if;
    if not v_is_tall then v_not_tall := v_not_tall + 1; continue; end if;

    v_tall := v_tall + 1;
    if v_conf = 'low' then v_lowconf := v_lowconf + 1; end if;

    if v_existing + v_ins >= p_cap then v_capped := v_capped + 1; continue; end if;

    v_url := rtrim(p_store, '/') || '/products/' || (v_prod->>'handle');
    if exists (select 1 from products where retailer_id = v_retailer_id and product_url = v_url) then
      v_dup := v_dup + 1; continue;
    end if;

    select min((v->>'price')::numeric) into v_price
      from jsonb_array_elements(coalesce(v_prod->'variants', '[]'::jsonb)) v
      where v->>'price' is not null;
    v_price := coalesce(v_price, 0);

    if v_ptype <> '' then
      m := regexp_split_to_array(v_ptype, '\s+');
      v_cat := coalesce(m[array_upper(m, 1)], 'Other');
    else
      select t into v_cat from unnest(v_tags) t
        where t <> '' and t !~* '^\d|promo|clearance|sale|hidden|block|group|division|matchup|^atr_|^rgroup_|soldout'
          and t ~ '^[A-Za-z]+$'
        limit 1;
      v_cat := coalesce(initcap(v_cat), 'Other');
    end if;

    v_styles := coalesce(array(
      select t from unnest(v_tags) t
      where t <> '' and length(t) < 30
        and t !~* '^\d|promo|clearance|sale|hidden|block|group|division|matchup|^atr_|^rgroup_|soldout'
      limit 6), '{}'::text[]);

    v_body := coalesce(v_prod->>'body_html', '');
    v_mtype := null; v_mcm := null; v_rawm := null;
    m := regexp_match(v_body, '(inseam[:\s]*[a-z]*\s*(\d+(\.\d+)?)\s*")', 'i');
    if m is not null then
      v_mtype := 'inseam'; v_rawm := m[1]; v_mcm := round(m[2]::numeric * 2.54, 1);
    else
      m := regexp_match(v_body, '((\d+(\.\d+)?)\s*"\s*inseam)', 'i');
      if m is not null then
        v_mtype := 'inseam'; v_rawm := m[1]; v_mcm := round(m[2]::numeric * 2.54, 1);
      else
        m := regexp_match(v_body, '(sleeve\s*length[:\s]*(\d+(\.\d+)?)\s*")', 'i');
        if m is not null then
          v_mtype := 'sleeve'; v_rawm := m[1]; v_mcm := round(m[2]::numeric * 2.54, 1);
        else
          m := regexp_match(v_body, '(body\s*length[:\s]*(\d+(\.\d+)?)\s*")', 'i');
          if m is not null then
            v_mtype := 'body_length'; v_rawm := m[1]; v_mcm := round(m[2]::numeric * 2.54, 1);
          end if;
        end if;
      end if;
    end if;

    v_labels := coalesce(array(
      select distinct btrim(x)
      from jsonb_array_elements(coalesce(v_prod->'variants', '[]'::jsonb)) v,
      lateral unnest(array[v->>'option1', v->>'option2', v->>'option3']) x
      where x is not null and (
        btrim(x) ~* '^\d?x{0,3}lt$|^\d?x{0,3}mt$|^xt$'
        or btrim(x) ~* '\ytall\y|\yextra\s*tall\y'
        or btrim(x) ~* '\y3[4-9]l\y|\y40l\y')
      order by 1), '{}'::text[]);
    v_sizelabel := coalesce(nullif(array_to_string(v_labels, ', '), ''), 'Tall');

    insert into products (retailer_id, name, category, price_cents, currency, style_tags, size_note, product_url, active)
    values (v_retailer_id, v_title, v_cat, round(v_price * 100)::int, p_currency, v_styles,
            coalesce(v_rawm, v_sizelabel), v_url, v_conf = 'high')
    returning id into v_pid;

    v_i := 0;
    for v_img in select * from jsonb_array_elements(coalesce(v_prod->'images', '[]'::jsonb)) limit 6 loop
      insert into product_images (product_id, image_url, is_model_shot, sort_order)
      values (v_pid, v_img->>'src', v_i = 0, v_i);
      v_i := v_i + 1;
    end loop;

    insert into tall_sizes (product_id, size_label, size_system, measurement_type, measurement_cm)
    values (v_pid, v_sizelabel, p_size_system, coalesce(v_mtype, 'unknown'), v_mcm);

    v_ins := v_ins + 1;
  end loop;

  return jsonb_build_object(
    'page', p_page, 'seen', v_seen, 'tall_matched', v_tall, 'inserted', v_ins,
    'already_in_db', v_dup, 'not_tall', v_not_tall, 'gift_cards', v_gift,
    'sold_out', v_soldout, 'low_confidence', v_lowconf, 'cap_hit', v_capped,
    'has_more', v_seen = 250, 'retailer_id', v_retailer_id);
end $$;

revoke all on function public.ingest_shopify_page(text,int,text,text,text,text,text,int) from public, anon, authenticated;
