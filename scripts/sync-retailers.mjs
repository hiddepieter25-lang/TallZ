#!/usr/bin/env node
/**
 * Unattended re-sync across every approved retailer in the database — the
 * scheduled counterpart to the manual pull-shopify-products.mjs flow.
 * Approved retailers come from two places: the original manually-onboarded
 * ones, and candidates discover-retailers.mjs found that an admin approved
 * via /admin/retailers.
 *
 * There is no photo-review step and nothing gets printed as SQL for a human
 * to paste: new products are written straight to Supabase with
 * color/material/pattern left null (same as the manual flow leaves them
 * before a human fills them in), so they surface in /admin/catalog's
 * "missing fields" filter for later review. Existing products are never
 * touched — a human's manual edits in /admin/catalog can never be
 * overwritten by a re-sync.
 *
 * Usage:   node scripts/sync-retailers.mjs
 * Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { fetchProducts, buildCandidates, guessCurrency } from "./lib/shopify-source.mjs";
import {
  createServiceClient,
  getApprovedRetailers,
  insertNewProducts,
  logIngestionJob,
} from "./lib/supabase-write.mjs";

const SOURCE_TYPE = "shopify_products_json";
const FETCH_LIMIT = 100; // page 1 only, same as the manual flow — no pagination
const CANDIDATE_POOL = 100; // don't pre-truncate candidates before dedup; the
// per-run cap on genuinely *new* inserts lives in insertNewProducts (maxNew)
const MAX_NEW_PER_RUN = 20;

async function syncRetailer(supabase, retailer) {
  const result = await fetchProducts(retailer.url, retailer.path, FETCH_LIMIT);
  if (!result.ok) {
    throw new Error(`fetch failed: HTTP ${result.status} — ${result.reason}`);
  }

  const candidates = buildCandidates(result.products, {
    url: retailer.url,
    type: retailer.type,
    max: CANDIDATE_POOL,
  });
  const currency = retailer.currency || guessCurrency(retailer.url);
  const { inserted, alreadyKnown, deferred } = await insertNewProducts(
    supabase,
    retailer.id,
    candidates,
    currency,
    { maxNew: MAX_NEW_PER_RUN }
  );
  return { inserted, alreadyKnown, deferred };
}

async function main() {
  const supabase = createServiceClient();
  const retailers = await getApprovedRetailers(supabase);

  let hadFailure = false;

  for (const retailer of retailers) {
    console.log(`\n${retailer.name} (${retailer.url})`);
    try {
      const { inserted, alreadyKnown, deferred } = await syncRetailer(supabase, retailer);
      console.log(
        `  ${inserted} new, ${alreadyKnown} already known${deferred ? `, ${deferred} deferred to next run` : ""}`
      );
      await logIngestionJob(supabase, {
        retailerId: retailer.id,
        sourceType: SOURCE_TYPE,
        status: "success",
        itemsIngested: inserted,
        errors: null,
      });
    } catch (err) {
      hadFailure = true;
      console.error(`  FAILED: ${err.message}`);
      // Supabase/Postgrest errors carry extra fields that err.message alone
      // drops — print them too so a follow-up failure doesn't need another
      // round of guessing.
      for (const field of ["status", "code", "details", "hint"]) {
        if (err[field]) console.error(`    ${field}: ${err[field]}`);
      }
      if (err.cause) console.error(`    cause: ${err.cause}`);
      try {
        await logIngestionJob(supabase, {
          retailerId: retailer.id,
          sourceType: SOURCE_TYPE,
          status: "error",
          itemsIngested: 0,
          errors: err.message,
        });
      } catch {
        // Best-effort — the console.error above is the record either way.
      }
    }
  }

  if (hadFailure) process.exitCode = 1;
}

await main();
