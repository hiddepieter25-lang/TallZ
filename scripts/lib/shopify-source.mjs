/**
 * Shared Shopify /products.json fetching, filtering, and field-guessing
 * logic — extracted from pull-shopify-products.mjs so both the manual
 * "check"/"pull" CLI and the unattended sync-retailers.mjs job use the exact
 * same rules instead of two copies drifting apart.
 */

export const UA = "Mozilla/5.0 (compatible; tallz-product-research/1.0)";

export const EXCLUDE_TITLE = /gift card|checkout|protection|insurance|warranty|^shipping/i;

/**
 * Size labels that mean "tall" on their own — LT, XLT, 2XLT, MT, XT, 34L..40L.
 * Anchored, because "lt" appears inside plenty of ordinary words.
 */
const TALL_SIZE_LABEL = /^\d?x{0,3}lt$|^\d?x{0,3}mt$|^xt$|^3[4-9]l$|^40l$/i;

/** The words a human would read as "this is cut for tall people". */
const TALL_PHRASE = /\btall\b|\bextra\s*tall\b|\bbig\s*(?:&|and)\s*tall\b/i;

/**
 * Every field on a Shopify product that can carry a tall marker, other than
 * the title: the product type, its tags, and the size options on its variants.
 *
 * These are the same fields `ingest_shopify_page` already trusts in SQL. Keeping
 * one answer to "is this tall?" matters: discovery used to ask only the title and
 * so rejected shops the ingester would happily import. TALLTOGS has "tall" in
 * zero of its 42 product titles and in 36 of their tags — it was turned away at
 * the door while sitting in the catalog with 80 products.
 */
export function tallSignalFields(product) {
  const tags = Array.isArray(product.tags)
    ? product.tags
    : String(product.tags ?? "").split(",");

  const variantOptions = (product.variants ?? []).flatMap((v) => [
    v.option1,
    v.option2,
    v.option3,
  ]);

  const optionValues = (product.options ?? []).flatMap((o) => o.values ?? []);

  return [product.product_type ?? "", ...tags, ...variantOptions, ...optionValues]
    .filter(Boolean)
    .map((value) => String(value).trim());
}

/**
 * "high" when a structured field says so, "low" when only the title does, null
 * when nothing does. Mirrors the confidence split in `ingest_shopify_page`,
 * where title-only matches are inserted inactive pending review.
 */
export function tallConfidence(product) {
  for (const field of tallSignalFields(product)) {
    if (TALL_SIZE_LABEL.test(field) || TALL_PHRASE.test(field)) return "high";
  }
  if (TALL_PHRASE.test(product.title ?? "")) return "low";
  return null;
}

export function isTallProduct(product) {
  return tallConfidence(product) !== null;
}

/**
 * Country-code domains we can read a market off. Europe is over-represented on
 * purpose: TallZ launches there, and discovery searches European-language
 * queries, so these are the endings new candidates actually arrive on.
 *
 * A .com tells us nothing — a Dutch brand on a .com still lands here as USA.
 * That is what the pending/approve step in /admin/retailers is for; a person
 * fixes it in one click before the retailer goes live.
 */
const DOMAIN_MARKETS = [
  { match: /.co.uk$|.uk$/, country: "UK", region: "UK", currency: "GBP" },
  { match: /.nz$/, country: "New Zealand", region: "NZ", currency: "NZD" },
  { match: /.com.au$|.au$/, country: "Australia", region: "AU", currency: "AUD" },
  { match: /.ca$/, country: "Canada", region: "CA", currency: "CAD" },
  { match: /.de$/, country: "Germany", region: "EU", currency: "EUR" },
  { match: /.fr$/, country: "France", region: "EU", currency: "EUR" },
  { match: /.nl$/, country: "Netherlands", region: "EU", currency: "EUR" },
  { match: /.be$/, country: "Belgium", region: "EU", currency: "EUR" },
  { match: /.it$/, country: "Italy", region: "EU", currency: "EUR" },
  { match: /.es$/, country: "Spain", region: "EU", currency: "EUR" },
  { match: /.at$/, country: "Austria", region: "EU", currency: "EUR" },
  { match: /.ie$/, country: "Ireland", region: "EU", currency: "EUR" },
  { match: /.fi$/, country: "Finland", region: "EU", currency: "EUR" },
  { match: /.pt$/, country: "Portugal", region: "EU", currency: "EUR" },
  { match: /.pl$/, country: "Poland", region: "EU", currency: "PLN" },
  { match: /.se$/, country: "Sweden", region: "EU", currency: "SEK" },
  { match: /.dk$/, country: "Denmark", region: "EU", currency: "DKK" },
  { match: /.no$/, country: "Norway", region: "EU", currency: "NOK" },
  { match: /.ch$/, country: "Switzerland", region: "EU", currency: "CHF" },
  { match: /.eu$/, country: "Europe", region: "EU", currency: "EUR" },
];

function marketFor(url) {
  const host = new URL(url).hostname;
  return DOMAIN_MARKETS.find((m) => m.match.test(host));
}

export function guessCurrency(url) {
  return marketFor(url)?.currency ?? "USD";
}

export function guessRegion(url) {
  return marketFor(url)?.region ?? "US";
}

export function guessCountry(url) {
  return marketFor(url)?.country ?? "USA";
}

export function guessCategory(title) {
  const t = title.toLowerCase();
  if (/cardigan|sweater|jumper|\bknit/.test(t)) return "Knitwear";
  if (/jean|denim/.test(t)) return "Denim";
  if (/hoodie/.test(t)) return "Hoodie";
  if (/blazer|suit jacket|sport coat/.test(t)) return "Blazer";
  if (/jacket|coat|parka/.test(t)) return "Jacket";
  if (/dress|jumpsuit|skirt/.test(t)) return "Dress";
  if (/jogger|legging|\btrack\b|sweatpant|activewear/.test(t)) return "Activewear";
  if (/cargo/.test(t)) return "Cargo";
  if (/trouser|\bpant|chino|slack/.test(t)) return "Trousers";
  return "Shirt";
}

export function guessFit(title) {
  const t = title.toLowerCase();
  if (/\bslim\b|skinny|fitted|tapered/.test(t)) return "slim";
  if (/oversized|\bboxy\b|baggy/.test(t)) return "baggy";
  if (/relaxed|wide leg|wide-leg|loose fit/.test(t)) return "relaxed";
  return "regular";
}

// Title cues first (explicit "for tall men"/"women's" etc. show up often in
// this catalog's real titles); falls back to the retailer's own clothing_type
// when the title itself doesn't say. Still just a first pass — the reviewing
// agent should eyeball the photo and correct this if it looks wrong, same as
// color/material/pattern below.
export function guessGender(title, retailerType) {
  const t = title.toLowerCase();
  if (/\bwomen'?s?\b|\bfor tall women\b|\bladies\b|\bher\b/.test(t)) return "women";
  if (/\bmen'?s?\b|\bfor tall men\b|\bhis\b/.test(t)) return "men";
  if (retailerType === "men" || retailerType === "women") return retailerType;
  return "unisex";
}

export function guessStyleTags(category, title) {
  const t = title.toLowerCase();
  switch (category) {
    case "Denim":
      return ["denim", "streetwear"];
    case "Hoodie":
    case "Activewear":
      return ["streetwear", "athleisure"];
    case "Blazer":
      return ["workwear", "evening"];
    case "Dress":
      return ["evening", "minimal"];
    case "Knitwear":
      return ["minimal", "workwear"];
    case "Cargo":
      return ["streetwear", "workwear"];
    default:
      return /graphic|print|oversized|street/.test(t)
        ? ["streetwear", "minimal"]
        : ["minimal", "workwear"];
  }
}

export async function fetchProducts(baseUrl, path, limit) {
  const feedUrl = `${baseUrl.replace(/\/$/, "")}${path || ""}/products.json?limit=${limit}`;
  let res;
  try {
    res = await fetch(feedUrl, { headers: { "User-Agent": UA } });
  } catch (err) {
    return { ok: false, status: 0, feedUrl, reason: `network error — ${err.cause?.code || err.message}` };
  }
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, status: res.status, feedUrl, notShopify: true, reason: "not JSON — not a Shopify feed (or blocked)" };
  }
  if (!Array.isArray(json.products)) {
    return { ok: false, status: res.status, feedUrl, notShopify: true, reason: "JSON but no products[] array" };
  }
  return { ok: true, status: res.status, feedUrl, products: json.products };
}

/**
 * Turns a raw /products.json `products[]` array into the same guessed,
 * deduped, capped candidate shape pull-shopify-products.mjs has always
 * built inline. `type` is the retailer's clothing_type (men/women/unisex),
 * used as a gender fallback; `max` caps how many candidates come back.
 */
export function buildCandidates(rawProducts, { url, type, max }) {
  let candidates = rawProducts.filter((p) => !EXCLUDE_TITLE.test(p.title));

  const tallOnly = candidates.filter(isTallProduct);
  if (tallOnly.length > 0) candidates = tallOnly;

  // Dedupe by exact title (color/size variants often repeat the same title).
  const seen = new Set();
  candidates = candidates.filter((p) => {
    if (seen.has(p.title)) return false;
    seen.add(p.title);
    return true;
  });

  const maxCount = Number(max) || 8;
  return candidates.slice(0, maxCount).map((p) => {
    const category = guessCategory(p.title);
    const priceCents = Math.round(parseFloat(p.variants?.[0]?.price ?? "0") * 100);
    const img = p.images?.[0]?.src;
    const imageUrl = img ? (img.startsWith("http") ? img : `https:${img}`) : null;
    return {
      name: p.title,
      category,
      tags: guessStyleTags(category, p.title),
      fit: guessFit(p.title),
      gender: guessGender(p.title, type),
      // Left null on purpose — keyword-matching the title can't reliably
      // catch these. A human fills them in by eye (manual pull flow) or they
      // stay null until reviewed in /admin/catalog (unattended sync flow).
      color: null,
      material: null,
      pattern: null,
      priceCents,
      productUrl: `${url.replace(/\/$/, "")}/products/${p.handle}`,
      imageUrl,
    };
  });
}
