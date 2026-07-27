/**
 * Direct Supabase writes for the unattended sync path (sync-retailers.mjs).
 * The manual pull-shopify-products.mjs CLI is untouched and still prints SQL
 * for a human to review — this module is only consumed by the new
 * queue-driven job, which cannot rely on a human pasting SQL.
 */
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase's own client already appends "/rest/v1" itself — if the pasted
 * SUPABASE_URL secret is the REST endpoint shown elsewhere in the dashboard
 * (already ending in /rest/v1) rather than the bare project URL, every
 * request ends up as .../rest/v1/rest/v1/retailers, which genuinely doesn't
 * exist (confirmed via Supabase's own API logs). Strip it defensively so
 * either form works.
 */
export function normalizeSupabaseUrl(rawUrl) {
  return rawUrl?.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

export function createServiceClient() {
  // .trim() guards against a stray trailing newline/space in the secret
  // value (easy to introduce when copy-pasting into GitHub Actions secrets)
  // — that alone is enough to make every request fail with a cryptic
  // "Invalid path specified in request URL" error.
  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables — required for direct writes."
    );
  }

  // Turns "every request fails with a cryptic PostgREST error" into an
  // actionable message right away — the most common cause is the two
  // secrets being pasted into the wrong fields (swapped), which silently
  // makes `url` an unparseable JWT string instead of a URL.
  try {
    new URL(url);
  } catch {
    throw new Error(
      `SUPABASE_URL doesn't look like a valid URL (starts with "${url.slice(0, 12)}..."). ` +
        "Check the SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY secrets aren't swapped — " +
        "SUPABASE_URL should look like https://xxxx.supabase.co, not start with 'eyJ'."
    );
  }

  // Same idea for the key — never log the key itself, but its shape/length
  // alone catches the two most common paste mistakes (swapped secrets, or
  // only part of the key selected when copying it from the "reveal" box).
  if (key.startsWith("http")) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY looks like a URL — check the two secrets aren't swapped.");
  }
  if (key.length < 100) {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY looks too short (${key.length} characters) — a real Supabase service ` +
        "role key is normally 200+ characters. You likely copied only part of it."
    );
  }

  console.log(`Using Supabase host: ${new URL(url).hostname}`);
  // Explicitly pin Node's own native fetch instead of letting supabase-js
  // auto-pick an implementation — a known source of "Invalid path specified
  // in request URL" errors that only show up on some Node/OS combinations
  // (e.g. GitHub Actions' Ubuntu runner vs. a local Windows machine).
  return createClient(url, key, { auth: { persistSession: false }, global: { fetch } });
}

/**
 * The retailer queue for sync-retailers.mjs, sourced from the database
 * instead of a file — `retailers` is the single source of truth (the
 * manual pull-shopify-products.mjs flow already writes there directly,
 * and discover-retailers.mjs adds pending rows there too). Only
 * status='approved' rows are eligible to be synced.
 */
export async function getApprovedRetailers(supabase) {
  const { data, error } = await supabase
    .from("retailers")
    .select(
      "id, name, website_url, tall_section_url, country, clothing_type, tall_label_example, region, size_system, shipping_countries"
    )
    .eq("status", "approved")
    .order("name");
  if (error) throw error;

  return (data ?? []).map((r) => {
    // tall_section_url is the same as website_url for most retailers; when
    // it differs and is a sub-path of it, that's the --path override a
    // human supplied during onboarding (e.g. /collections/mens-tall-collection).
    let path = "";
    if (r.tall_section_url && r.tall_section_url !== r.website_url && r.tall_section_url.startsWith(r.website_url)) {
      path = r.tall_section_url.slice(r.website_url.length);
    }
    return {
      id: r.id,
      name: r.name,
      url: r.website_url,
      path,
      type: r.clothing_type,
      label: r.tall_label_example,
      region: r.region,
      sizeSystem: r.size_system,
      shipping: r.shipping_countries,
    };
  });
}

/**
 * Inserts only candidates whose product_url isn't already present for this
 * retailer — never updates/overwrites an existing row, since a human may
 * have already filled in color/material/pattern via /admin/catalog since
 * the last sync and this must not clobber that. `maxNew` caps how many
 * genuinely-new products get inserted in one run (applied *after* dedup, not
 * before) so a first-time backlog can't flood in hundreds of unreviewed rows
 * at once, while never causing a real incremental new arrival to be missed.
 */
export async function insertNewProducts(supabase, retailerId, candidates, currency, { maxNew = 20 } = {}) {
  const { data: existingRows, error: existingError } = await supabase
    .from("products")
    .select("product_url")
    .eq("retailer_id", retailerId);
  if (existingError) throw existingError;

  const existingUrls = new Set((existingRows ?? []).map((r) => r.product_url));
  const fresh = candidates.filter((c) => c.productUrl && !existingUrls.has(c.productUrl));
  const alreadyKnown = candidates.length - fresh.length;

  const toInsert = fresh.slice(0, maxNew);
  const deferred = fresh.length - toInsert.length;

  if (toInsert.length === 0) return { inserted: 0, alreadyKnown, deferred };

  const { data: insertedProducts, error: insertError } = await supabase
    .from("products")
    .insert(
      toInsert.map((c) => ({
        retailer_id: retailerId,
        name: c.name,
        category: c.category,
        price_cents: c.priceCents,
        currency,
        style_tags: c.tags,
        size_note: "Tall",
        fit: c.fit,
        gender: c.gender,
        color: c.color,
        material: c.material,
        pattern: c.pattern,
        product_url: c.productUrl,
      }))
    )
    .select("id, product_url");
  if (insertError) throw insertError;

  const idByUrl = new Map(insertedProducts.map((p) => [p.product_url, p.id]));
  const imageRows = toInsert
    .filter((c) => c.imageUrl && idByUrl.has(c.productUrl))
    .map((c) => ({
      product_id: idByUrl.get(c.productUrl),
      image_url: c.imageUrl,
      is_model_shot: true,
      sort_order: 0,
    }));

  if (imageRows.length > 0) {
    const { error: imageError } = await supabase.from("product_images").insert(imageRows);
    if (imageError) throw imageError;
  }

  return { inserted: toInsert.length, alreadyKnown, deferred };
}

/** All known retailer website URLs, any status — used to dedupe discovery candidates. */
export async function getKnownRetailerHostnames(supabase) {
  const { data, error } = await supabase.from("retailers").select("website_url");
  if (error) throw error;
  return new Set(
    (data ?? [])
      .map((r) => {
        try {
          return new URL(r.website_url).hostname.replace(/^www\./, "");
        } catch {
          return null;
        }
      })
      .filter(Boolean)
  );
}

/** Hostnames discover-retailers.mjs already checked and rejected, so repeat runs don't re-spend search/network calls on them. */
export async function getRejectedHostnames(supabase) {
  const { data, error } = await supabase.from("retailer_discovery_attempts").select("hostname");
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.hostname));
}

export async function recordRejectedAttempt(supabase, hostname, reason) {
  const { error } = await supabase
    .from("retailer_discovery_attempts")
    .upsert({ hostname, result: "rejected", reason, checked_at: new Date().toISOString() });
  if (error) throw error;
}

/**
 * Inserts a newly-discovered candidate as status='pending' — it only
 * becomes visible to the public site or eligible for sync-retailers.mjs
 * once an admin approves it via /admin/retailers.
 */
export async function insertPendingRetailer(supabase, retailer) {
  const { error } = await supabase.from("retailers").insert({
    name: retailer.name,
    country: retailer.country,
    clothing_type: retailer.type,
    tall_label_example: retailer.label,
    tall_section_url: retailer.sectionUrl || retailer.url,
    website_url: retailer.url,
    region: retailer.region,
    size_system: retailer.sizeSystem,
    shipping_countries: retailer.shipping,
    status: "pending",
  });
  if (error) throw error;
}

export async function logIngestionJob(supabase, { retailerId, sourceType, status, itemsIngested, errors }) {
  const { error } = await supabase.from("ingestion_jobs").insert({
    retailer_id: retailerId,
    source_type: sourceType,
    status,
    items_ingested: itemsIngested,
    errors: errors || null,
  });
  if (error) throw error;
}
