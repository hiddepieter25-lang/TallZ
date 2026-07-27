#!/usr/bin/env node
/**
 * Automatic retailer discovery — the counterpart to sync-retailers.mjs
 * (which only re-syncs retailers already in the database). This script
 * finds NEW candidates via a real search engine (SerpAPI), checks each one
 * the same way pull-shopify-products.mjs's "check" command does (is it
 * Shopify, does it carry tall-labeled products), and writes accepted
 * candidates straight into the `retailers` table with status='pending'.
 *
 * Nothing goes live automatically: an admin approves or rejects each
 * pending candidate from /admin/retailers before sync-retailers.mjs will
 * ever pull its products, and before it can appear anywhere on the public
 * site (enforced by the retailers RLS policy, not just app code).
 *
 * Metadata that a human would normally eyeball (country, clothing_type,
 * label, region, shipping) is filled in with best-effort guesses — the
 * admin review step is exactly where a human catches a bad guess before
 * it goes live.
 *
 * Usage:   node scripts/discover-retailers.mjs
 * Requires env vars: SERPAPI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { fetchProducts, EXCLUDE_TITLE, guessCurrency, guessRegion, guessCountry } from "./lib/shopify-source.mjs";
import {
  createServiceClient,
  getKnownRetailerHostnames,
  getRejectedHostnames,
  recordRejectedAttempt,
  insertPendingRetailer,
} from "./lib/supabase-write.mjs";

const SEARCH_QUERIES = [
  "tall size clothing brand online store",
  "tall men's clothing brand online store",
  "tall women's clothing brand online store",
];
const RESULTS_PER_QUERY = 10;

async function searchCandidates(query, apiKey) {
  const url = `https://serpapi.com/search.json?engine=google&num=${RESULTS_PER_QUERY}&q=${encodeURIComponent(query)}&api_key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`SerpAPI request failed: HTTP ${res.status}`);
  }
  const data = await res.json();
  if (data.error) throw new Error(`SerpAPI error: ${data.error}`);
  return (data.organic_results ?? []).map((r) => r.link).filter(Boolean);
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Same bar as pull-shopify-products.mjs's "check" command: real Shopify feed, at least one tall-labeled product. */
async function checkCandidate(baseUrl) {
  const result = await fetchProducts(baseUrl, "", 20);
  if (!result.ok) return { ok: false, reason: result.reason };
  const real = result.products.filter((p) => !EXCLUDE_TITLE.test(p.title));
  const tallProducts = real.filter((p) => /tall/i.test(p.title));
  if (tallProducts.length === 0) {
    return { ok: false, reason: "Shopify confirmed, but no tall-labeled products on the first page" };
  }
  return { ok: true, tallCount: tallProducts.length };
}

async function main() {
  const apiKey = process.env.SERPAPI_API_KEY?.trim();
  if (!apiKey) throw new Error("Missing SERPAPI_API_KEY environment variable.");

  const supabase = createServiceClient();
  const knownHostnames = await getKnownRetailerHostnames(supabase);
  const rejectedHostnames = await getRejectedHostnames(supabase);

  const candidateHostnames = new Set();
  for (const query of SEARCH_QUERIES) {
    console.log(`Searching: "${query}"`);
    let links;
    try {
      links = await searchCandidates(query, apiKey);
    } catch (err) {
      console.error(`  search failed: ${err.message}`);
      continue;
    }
    for (const link of links) {
      const host = hostnameOf(link);
      if (host && !knownHostnames.has(host) && !rejectedHostnames.has(host)) {
        candidateHostnames.add(host);
      }
    }
  }

  console.log(`\n${candidateHostnames.size} new candidate site(s) to check (no cap — checking all of them).`);

  let added = 0;
  for (const host of candidateHostnames) {
    const baseUrl = `https://${host}`;
    console.log(`\nChecking ${baseUrl}`);
    const result = await checkCandidate(baseUrl);

    if (!result.ok) {
      console.log(`  rejected: ${result.reason}`);
      await recordRejectedAttempt(supabase, host, result.reason);
      continue;
    }

    console.log(`  accepted: ${result.tallCount} tall-labeled product(s) found — adding as pending for admin review`);
    const region = guessRegion(baseUrl);
    await insertPendingRetailer(supabase, {
      name: host.split(".")[0].replace(/^\w/, (c) => c.toUpperCase()),
      url: baseUrl,
      sectionUrl: baseUrl,
      country: guessCountry(baseUrl),
      type: "unisex", // safe default — can't reliably tell men's/women's/unisex without a human look
      label: "Tall",
      region,
      sizeSystem: region,
      shipping: [region],
      currency: guessCurrency(baseUrl),
    });
    added++;
  }

  console.log(`\nDone — ${added} new candidate(s) added as pending, awaiting approval in /admin/retailers.`);
}

await main();
