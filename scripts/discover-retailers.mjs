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
import {
  fetchProducts,
  EXCLUDE_TITLE,
  isTallProduct,
  guessCurrency,
  guessRegion,
  guessCountry,
} from "./lib/shopify-source.mjs";
import { checkRobots } from "./lib/robots.mjs";
import {
  createServiceClient,
  getKnownRetailerHostnames,
  getRejectedHostnames,
  recordRejectedAttempt,
  insertPendingRetailer,
} from "./lib/supabase-write.mjs";

/**
 * Google returns much the same results for the same words, so three fixed
 * queries found retailers once and then nothing: by the second run every hit
 * was already known or already rejected. This bank is rotated instead.
 *
 * Weighted towards Europe because that is where TallZ launches, and because
 * the catalog is currently almost entirely American — a European user pays
 * shipping and duty on nearly every item in it.
 */
const SEARCH_QUERIES = [
  // English — general and by segment
  "tall size clothing brand online store",
  "tall men's clothing brand online store",
  "tall women's clothing brand online store",
  "clothing for tall people online shop",
  "extra long inseam jeans brand",
  "tall fit shirts long sleeve brand",
  // UK
  "tall clothing UK online shop",
  "long leg trousers tall UK brand",
  "tall womens clothing UK boutique",
  // Netherlands / Belgium
  "lange maten kleding webshop",
  "kleding voor lange mannen webshop",
  "kleding voor lange vrouwen online",
  "extra lange broeken heren webshop",
  // Germany / Austria / Switzerland
  "Ubergrossen lange Herren Kleidung Shop",
  "Mode fur grosse Manner Online Shop",
  "Mode fur grosse Frauen Online Shop",
  "extra lange Hosen Herren Shop",
  // France / Belgium (FR)
  "vetements grande taille homme grand",
  "vetements pour femmes grandes boutique en ligne",
  "pantalon longueur extra homme boutique",
  // Nordics
  "klader for langa man webbutik",
  "toj til hoje maend webshop",
  // Broader European English
  "tall clothing brand Europe online",
  "tall sizes clothing shop EU shipping",
];

/** How many of the bank to use per run. Each one is a single paid search. */
const QUERIES_PER_RUN = 6;

/** Same one request either way — 20 results simply returns twice the candidates. */
const RESULTS_PER_QUERY = 20;

/**
 * Deterministic rotation by ISO week, so consecutive weeks get different
 * queries and the whole bank comes round in about four weeks. Deterministic
 * rather than random so a run can be reproduced when something looks wrong.
 */
export function queriesForWeek(weekNumber, bank = SEARCH_QUERIES, count = QUERIES_PER_RUN) {
  const start = (weekNumber * count) % bank.length;
  return Array.from({ length: Math.min(count, bank.length) }, (_, i) => bank[(start + i) % bank.length]);
}

/**
 * Which week we are in, counted from a Monday.
 *
 * Aligned to Monday rather than to 1 January on purpose: the job runs Monday
 * night, so a boundary anywhere else would mean a run could sit near the edge
 * of a bucket. Counting from the first Monday of the epoch puts every boundary
 * exactly where the schedule is.
 */
export function weekIndex(date = new Date()) {
  const MONDAY_EPOCH = Date.UTC(1970, 0, 5); // 5 Jan 1970 was a Monday
  return Math.floor((date.getTime() - MONDAY_EPOCH) / (7 * 24 * 60 * 60 * 1000));
}

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

/** Below this, a tall hit is more likely a coincidence than a tall range. */
const MIN_TALL_PRODUCTS = 3;

/** One request either way; 20 products was too thin a sample to judge a shop on. */
const CHECK_SAMPLE_SIZE = 250;

/**
 * Is this a real Shopify store with a tall range?
 *
 * Previously this asked only whether "tall" appeared in a product title, over
 * the first 20 products. That rejected TALLTOGS (0 of 42 titles, 36 of their
 * tags) and Faherty (0 titles, 4 in structured fields) — both already in the
 * catalog, with 80 and 36 products. Two of the ten retailers that actually
 * work would have been turned away.
 */
async function checkCandidate(baseUrl) {
  // Asked before anything is fetched, not after. A shop that says no in
  // robots.txt shouldn't have its catalog read first and be discarded second.
  const robots = await checkRobots(baseUrl);
  if (!robots.allowed) return { ok: false, reason: robots.reason };

  const result = await fetchProducts(baseUrl, "", CHECK_SAMPLE_SIZE);
  if (!result.ok) return { ok: false, reason: result.reason };

  const real = result.products.filter((p) => !EXCLUDE_TITLE.test(p.title));
  const tallProducts = real.filter(isTallProduct);

  if (tallProducts.length < MIN_TALL_PRODUCTS) {
    return {
      ok: false,
      reason: `Shopify confirmed, but only ${tallProducts.length} tall product(s) in ${real.length} checked (need ${MIN_TALL_PRODUCTS})`,
    };
  }
  return { ok: true, tallCount: tallProducts.length, checked: real.length };
}

async function main() {
  const apiKey = process.env.SERPAPI_API_KEY?.trim();
  if (!apiKey) throw new Error("Missing SERPAPI_API_KEY environment variable.");

  const supabase = createServiceClient();
  const knownHostnames = await getKnownRetailerHostnames(supabase);
  const rejectedHostnames = await getRejectedHostnames(supabase);

  const queries = queriesForWeek(weekIndex());
  console.log(`Week ${weekIndex()} — using ${queries.length} of ${SEARCH_QUERIES.length} queries.`);

  const candidateHostnames = new Set();
  for (const query of queries) {
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

    console.log(`  accepted: ${result.tallCount} tall product(s) in ${result.checked} checked — adding as pending for admin review`);
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

// Only when run as a script: importing this file in a test must not fire off
// searches or write to the database.
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  await main();
}
