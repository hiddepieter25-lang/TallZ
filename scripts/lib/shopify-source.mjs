/**
 * Shared Shopify /products.json fetching, filtering, and field-guessing
 * logic — extracted from pull-shopify-products.mjs so both the manual
 * "check"/"pull" CLI and the unattended sync-retailers.mjs job use the exact
 * same rules instead of two copies drifting apart.
 */

export const UA = "Mozilla/5.0 (compatible; tallz-product-research/1.0)";

export const EXCLUDE_TITLE = /gift card|checkout|protection|insurance|warranty|^shipping/i;

export function guessCurrency(url) {
  const host = new URL(url).hostname;
  if (/\.co\.uk$|\.uk$/.test(host)) return "GBP";
  if (/\.nz$/.test(host)) return "NZD";
  if (/\.com\.au$|\.au$/.test(host)) return "AUD";
  if (/\.de$|\.fr$|\.it$|\.es$|\.nl$|\.eu$/.test(host)) return "EUR";
  return "USD";
}

// Best-effort default only — always confirm/override with --region and
// --size-system by eye (per-brand shipping is not something this feed
// exposes, unlike currency which the domain TLD is a decent proxy for).
export function guessRegion(url) {
  const host = new URL(url).hostname;
  if (/\.co\.uk$|\.uk$/.test(host)) return "UK";
  if (/\.nz$/.test(host)) return "NZ";
  if (/\.com\.au$|\.au$/.test(host)) return "AU";
  if (/\.de$|\.fr$|\.it$|\.es$|\.nl$|\.eu$/.test(host)) return "EU";
  return "US";
}

// Same best-effort TLD proxy as guessRegion/guessCurrency, used by
// discover-retailers.mjs to fill in the "country" field with no human
// involved — matches the granularity already used for existing retailers
// (e.g. "Germany" rather than a generic "EU").
export function guessCountry(url) {
  const host = new URL(url).hostname;
  if (/\.co\.uk$|\.uk$/.test(host)) return "UK";
  if (/\.nz$/.test(host)) return "New Zealand";
  if (/\.com\.au$|\.au$/.test(host)) return "Australia";
  if (/\.de$/.test(host)) return "Germany";
  if (/\.fr$/.test(host)) return "France";
  if (/\.nl$/.test(host)) return "Netherlands";
  if (/\.it$/.test(host)) return "Italy";
  if (/\.es$/.test(host)) return "Spain";
  return "USA";
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
    return { ok: false, status: res.status, feedUrl, reason: "not JSON — not a Shopify feed (or blocked)" };
  }
  if (!Array.isArray(json.products)) {
    return { ok: false, status: res.status, feedUrl, reason: "JSON but no products[] array" };
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

  const tallOnly = candidates.filter((p) => /tall/i.test(p.title));
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
