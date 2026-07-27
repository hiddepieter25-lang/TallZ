#!/usr/bin/env node
/**
 * Fully automatic retailer discovery — the counterpart to sync-retailers.mjs
 * (which only re-syncs retailers already in the queue). This script finds
 * NEW candidates via a real search engine (SerpAPI), checks each one the
 * same way pull-shopify-products.mjs's "check" command does (is it Shopify,
 * does it carry tall-labeled products), and — with no human review step —
 * appends the ones that pass straight into scripts/retailers.json.
 *
 * Metadata that a human would normally eyeball (country, clothing_type,
 * label, region, shipping) is filled in with best-effort guesses instead.
 * That's the real tradeoff of skipping the review step: faster growth,
 * lower guaranteed data quality than the manual/reviewed onboarding flow.
 *
 * scripts/retailers-rejected.json remembers every hostname already tried
 * (Shopify or not) so repeat runs don't burn search quota re-checking the
 * same rejected sites every month.
 *
 * Usage:   node scripts/discover-retailers.mjs
 * Requires env var: SERPAPI_API_KEY
 */
import { readFile, writeFile } from "node:fs/promises";
import { fetchProducts, EXCLUDE_TITLE, guessCurrency, guessRegion, guessCountry } from "./lib/shopify-source.mjs";

const RETAILERS_FILE = new URL("./retailers.json", import.meta.url);
const REJECTED_FILE = new URL("./retailers-rejected.json", import.meta.url);

const SEARCH_QUERIES = [
  "tall size clothing brand online store",
  "tall men's clothing brand online store",
  "tall women's clothing brand online store",
];
const RESULTS_PER_QUERY = 10;
const MAX_NEW_RETAILERS_PER_RUN = 3; // keeps one run from flooding the catalog with low-quality entries

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

  const retailers = JSON.parse(await readFile(RETAILERS_FILE, "utf8"));
  const rejected = JSON.parse(await readFile(REJECTED_FILE, "utf8"));

  const knownHostnames = new Set([
    ...retailers.map((r) => hostnameOf(r.url)),
    ...rejected.map((r) => r.hostname),
  ]);

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
      if (host && !knownHostnames.has(host)) candidateHostnames.add(host);
    }
  }

  console.log(`\n${candidateHostnames.size} new candidate site(s) to check.`);

  let added = 0;
  for (const host of candidateHostnames) {
    if (added >= MAX_NEW_RETAILERS_PER_RUN) {
      console.log(`\nReached the ${MAX_NEW_RETAILERS_PER_RUN}-per-run cap — remaining candidates deferred to next run.`);
      break;
    }

    const baseUrl = `https://${host}`;
    console.log(`\nChecking ${baseUrl}`);
    const result = await checkCandidate(baseUrl);

    if (!result.ok) {
      console.log(`  rejected: ${result.reason}`);
      rejected.push({ hostname: host, reason: result.reason, checkedAt: new Date().toISOString() });
      continue;
    }

    console.log(`  accepted: ${result.tallCount} tall-labeled product(s) found — adding with best-effort metadata`);
    const region = guessRegion(baseUrl);
    retailers.push({
      name: host.split(".")[0].replace(/^\w/, (c) => c.toUpperCase()),
      url: baseUrl,
      sectionUrl: baseUrl,
      path: "",
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

  await writeFile(RETAILERS_FILE, JSON.stringify(retailers, null, 2) + "\n");
  await writeFile(REJECTED_FILE, JSON.stringify(rejected, null, 2) + "\n");

  console.log(`\nDone — ${added} new retailer(s) added this run.`);
}

await main();
