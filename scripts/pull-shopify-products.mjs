#!/usr/bin/env node
/**
 * Finds and pulls real tall-size products (with real photos) from
 * Shopify-powered retailer sites, using their public /products.json feed —
 * the same trick used to bring in American Tall, Just Tall, Faherty, Alloy
 * Apparel, 2Tall, Tall by Design, and Westport Big & Tall. No API key,
 * account, or affiliate approval needed — this only works for stores built
 * on Shopify with that endpoint left open, which is not every retailer.
 *
 * Usage:
 *   node scripts/pull-shopify-products.mjs check <site-url>
 *   node scripts/pull-shopify-products.mjs pull <site-url> \
 *     --name "Brand Name" --country "USA" --type unisex --label "Tall" \
 *     [--path /collections/mens-tall] [--currency USD] [--max 8] \
 *     [--section-url https://brand.com/tall] \
 *     [--region EU] [--size-system EU] [--shipping "NL,DE,FR"]
 *
 * "check" just tells you whether the trick works for a given site.
 * "pull" downloads each candidate's photo to ./.pull-review-images/ (for the
 * reviewing agent to actually look at — color/material/pattern can't be
 * reliably keyword-matched from the title, only category/fit/gender are
 * guessed that way), then prints ready-to-run SQL (retailers + products +
 * product_images) to stdout — review it, fill in color/material/pattern
 * by eye, then run it via the Supabase MCP execute_sql tool. This script
 * never touches the database itself; it only prepares the SQL.
 */

import { mkdir, writeFile, rm } from "node:fs/promises";
import { UA, EXCLUDE_TITLE, fetchProducts, buildCandidates } from "./lib/shopify-source.mjs";
import { guessCurrency, guessRegion } from "./lib/shopify-source.mjs";

// Relative path — avoids any collision with the "path" identifier already
// used elsewhere in this file (e.g. runPull destructures opts.path).
const IMAGE_REVIEW_DIR = "./.pull-review-images";

function parseArgs(argv) {
  const [mode, url, ...rest] = argv;
  const opts = { mode, url };
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith("--")) {
      opts[rest[i].slice(2)] = rest[i + 1];
      i++;
    }
  }
  return opts;
}

function sqlEscape(s) {
  return String(s).replace(/'/g, "''");
}

/**
 * Downloads each product's primary photo into a local scratch folder so the
 * reviewing agent can actually look at them — this is the "identification"
 * step for color/material/pattern, which keyword-matching the title can't
 * do reliably. Best-effort: a failed download just means that one product
 * skips visual review, not a hard failure for the whole pull.
 */
async function downloadReviewImages(picked) {
  await rm(IMAGE_REVIEW_DIR, { recursive: true, force: true });
  await mkdir(IMAGE_REVIEW_DIR, { recursive: true });

  await Promise.all(
    picked.map(async (p, i) => {
      if (!p.imageUrl) return;
      try {
        const res = await fetch(p.imageUrl, { headers: { "User-Agent": UA } });
        if (!res.ok) return;
        const ext = p.imageUrl.split("?")[0].split(".").pop().slice(0, 4) || "jpg";
        const file = `${IMAGE_REVIEW_DIR}/${String(i).padStart(2, "0")}.${ext}`;
        await writeFile(file, Buffer.from(await res.arrayBuffer()));
        p.reviewImagePath = file;
      } catch {
        // Best-effort — see comment above.
      }
    })
  );
}

async function runCheck(url) {
  const result = await fetchProducts(url, "", 5);
  if (!result.ok) {
    console.log(`NOT SHOPIFY (or blocked): ${url}`);
    console.log(`  ${result.feedUrl} -> HTTP ${result.status}, ${result.reason}`);
    return;
  }
  const real = result.products.filter((p) => !EXCLUDE_TITLE.test(p.title));
  console.log(`SHOPIFY CONFIRMED: ${url}`);
  console.log(`  ${result.products.length} products in first page, ${real.length} look like real garments`);
  for (const p of real.slice(0, 5)) {
    console.log(`  - ${p.title} ($${p.variants?.[0]?.price})`);
  }
  if (!real.some((p) => /tall/i.test(p.title))) {
    console.log(
      `  NOTE: none of the sampled titles say "tall" — this may be a general catalog.` +
        ` Try a --path pointing at a tall-specific collection (e.g. /collections/mens-tall-collection).`
    );
  }
}

async function runPull(opts) {
  const {
    url,
    name,
    country,
    type,
    label,
    path,
    currency,
    max,
    "section-url": sectionUrl,
    region,
    "size-system": sizeSystem,
    shipping,
  } = opts;
  if (!url || !name || !country || !type || !label) {
    console.error(
      "Missing required options. Need: --name --country --type --label (and url as the 2nd argument)."
    );
    process.exitCode = 1;
    return;
  }
  const limit = 100;
  const result = await fetchProducts(url, path, limit);
  if (!result.ok) {
    console.error(`Could not pull from ${url}: HTTP ${result.status}, ${result.reason}`);
    process.exitCode = 1;
    return;
  }

  const picked = buildCandidates(result.products, { url, type, max });

  if (picked.length === 0) {
    console.error("No usable products found after filtering. Try a different --path or check the site manually.");
    process.exitCode = 1;
    return;
  }

  const finalCurrency = currency || guessCurrency(url);
  const finalRegion = region || guessRegion(url);
  const finalSizeSystem = sizeSystem || finalRegion;
  const shippingCountries = (shipping || finalRegion)
    .split(",")
    .map((c) => sqlEscape(c.trim()))
    .filter(Boolean);
  const retailerName = sqlEscape(name);

  await downloadReviewImages(picked);

  console.error(`\n--- REVIEW BEFORE RUNNING (${picked.length} products, currency guessed as ${finalCurrency}) ---`);
  for (const p of picked) {
    console.error(`  [${p.category}/${p.fit}/${p.gender}] ${p.name} — ${(p.priceCents / 100).toFixed(2)} ${finalCurrency}${p.imageUrl ? "" : "  (NO IMAGE — skip or fix)"}`);
    if (p.reviewImagePath) console.error(`      photo: ${p.reviewImagePath}`);
  }
  console.error(`--- Region guessed as ${finalRegion} / size system ${finalSizeSystem} / shipping [${shippingCountries.join(", ")}] — override with --region --size-system --shipping if wrong ---`);
  console.error(
    `--- IDENTIFICATION STEP: open each photo above and fill in p.color/p.material/p.pattern in the SQL below ---\n` +
      `--- (currently all NULL) before running it — same weight as checking category/fit/currency. ---\n`
  );

  let sql = `insert into public.retailers (name, country, clothing_type, tall_label_example, tall_section_url, website_url, region, size_system, shipping_countries) values\n`;
  sql += `('${retailerName}', '${sqlEscape(country)}', '${sqlEscape(type)}', '${sqlEscape(label)}', '${sqlEscape(sectionUrl || url)}', '${sqlEscape(url)}', '${finalRegion}', '${finalSizeSystem}', array[${shippingCountries.map((c) => `'${c}'`).join(",")}]);\n\n`;

  const sqlValue = (v) => (v === null || v === undefined ? "null" : `'${sqlEscape(v)}'`);

  sql += `with inserted as (\n  insert into public.products (retailer_id, name, category, price_cents, currency, style_tags, size_note, fit, gender, color, material, pattern, product_url) values\n`;
  sql += picked
    .map(
      (p) =>
        `  ((select id from public.retailers where name = '${retailerName}'), '${sqlEscape(p.name)}', '${p.category}', ${p.priceCents}, '${finalCurrency}', array[${p.tags.map((t) => `'${t}'`).join(",")}], 'Tall', '${p.fit}', ${sqlValue(p.gender)}, ${sqlValue(p.color)}, ${sqlValue(p.material)}, ${sqlValue(p.pattern)}, '${sqlEscape(p.productUrl)}')`
    )
    .join(",\n");
  sql += `\n  returning id, name\n)\n`;
  sql += `insert into public.product_images (product_id, image_url, is_model_shot, sort_order)\nselect i.id, v.image_url, true, 0 from inserted i join (values\n`;
  sql += picked
    .filter((p) => p.imageUrl)
    .map((p) => `  ('${sqlEscape(p.name)}', '${sqlEscape(p.imageUrl)}')`)
    .join(",\n");
  sql += `\n) as v(name, image_url) on v.name = i.name;\n`;

  console.log(sql);
}

const opts = parseArgs(process.argv.slice(2));
if (opts.mode === "check" && opts.url) {
  await runCheck(opts.url);
} else if (opts.mode === "pull" && opts.url) {
  await runPull(opts);
} else {
  console.error(
    "Usage:\n  node scripts/pull-shopify-products.mjs check <site-url>\n  node scripts/pull-shopify-products.mjs pull <site-url> --name \"Brand\" --country \"USA\" --type unisex --label \"Tall\" [--path /collections/x] [--currency USD] [--max 8] [--section-url https://...] [--region EU] [--size-system EU] [--shipping \"NL,DE,FR\"]"
  );
  process.exitCode = 1;
}
