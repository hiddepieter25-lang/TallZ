#!/usr/bin/env node
/**
 * Unattended re-sync across every retailer in scripts/retailers.json — the
 * scheduled counterpart to the manual pull-shopify-products.mjs flow.
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
import { readFile } from "node:fs/promises";
import { fetchProducts, buildCandidates, guessCurrency } from "./lib/shopify-source.mjs";
import {
  createServiceClient,
  upsertRetailer,
  insertNewProducts,
  logIngestionJob,
} from "./lib/supabase-write.mjs";

const QUEUE_FILE = new URL("./retailers.json", import.meta.url);
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
  const retailerId = await upsertRetailer(supabase, retailer);
  const currency = retailer.currency || guessCurrency(retailer.url);
  const { inserted, alreadyKnown, deferred } = await insertNewProducts(
    supabase,
    retailerId,
    candidates,
    currency,
    { maxNew: MAX_NEW_PER_RUN }
  );
  return { retailerId, inserted, alreadyKnown, deferred };
}

async function main() {
  const supabase = createServiceClient();
  const retailers = JSON.parse(await readFile(QUEUE_FILE, "utf8"));

  let hadFailure = false;

  for (const retailer of retailers) {
    console.log(`\n${retailer.name} (${retailer.url})`);
    try {
      const { retailerId, inserted, alreadyKnown, deferred } = await syncRetailer(supabase, retailer);
      console.log(
        `  ${inserted} new, ${alreadyKnown} already known${deferred ? `, ${deferred} deferred to next run` : ""}`
      );
      await logIngestionJob(supabase, {
        retailerId,
        sourceType: SOURCE_TYPE,
        status: "success",
        itemsIngested: inserted,
        errors: null,
      });
    } catch (err) {
      hadFailure = true;
      console.error(`  FAILED: ${err.message}`);
      // Best-effort job log — upsertRetailer itself may be what failed, in
      // which case there's no retailer_id to log against and the
      // console.error above (surfaced via non-zero exit in CI) is the record.
      try {
        const retailerId = await upsertRetailer(supabase, retailer);
        await logIngestionJob(supabase, {
          retailerId,
          sourceType: SOURCE_TYPE,
          status: "error",
          itemsIngested: 0,
          errors: err.message,
        });
      } catch {
        // Swallowed — see comment above.
      }
    }
  }

  if (hadFailure) process.exitCode = 1;
}

await main();
