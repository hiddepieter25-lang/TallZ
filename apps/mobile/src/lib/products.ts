// The shared domain core — product types, the quiz vocabulary, and the ranking
// algorithm. Originally ported from the web app.
//
// As of 2026-08-28 this is the only copy that ranks anything: the web's public
// routes were deleted. apps/web/src/server/queries/products.ts still exists,
// but only for the types and queries the admin panel reads — its ranking code
// is now dead weight there. Ranking changes belong here.
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type StyleTag =
  | "minimal"
  | "streetwear"
  | "workwear"
  | "denim"
  | "evening"
  | "athleisure";

export const STYLE_TAGS: { id: StyleTag; label: string }[] = [
  { id: "minimal", label: "Minimal" },
  { id: "streetwear", label: "Streetwear" },
  { id: "workwear", label: "Workwear" },
  { id: "denim", label: "Denim" },
  { id: "evening", label: "Evening" },
  { id: "athleisure", label: "Athleisure" },
];

export type OccasionTag = "everyday" | "work" | "going_out" | "active" | "weekend" | "loungewear";

// Occasion answers reuse the existing style-tag vocabulary instead of
// inventing a second taxonomy — one fewer thing to keep in sync on the
// product side.
export const OCCASION_TAGS: { id: OccasionTag; label: string; mapsTo: StyleTag[] }[] = [
  { id: "everyday", label: "Everyday", mapsTo: ["minimal", "streetwear"] },
  { id: "work", label: "Work", mapsTo: ["workwear"] },
  { id: "going_out", label: "Going out", mapsTo: ["evening"] },
  { id: "active", label: "Active", mapsTo: ["athleisure"] },
  { id: "weekend", label: "Weekend", mapsTo: ["denim", "streetwear"] },
  { id: "loungewear", label: "Loungewear", mapsTo: ["athleisure", "minimal"] },
];

export type Proportion = "long_legs" | "long_torso" | "long_arms" | "balanced";

export const PROPORTIONS: { id: Proportion; label: string; hint: string }[] = [
  { id: "long_legs", label: "Long legs", hint: "Trousers and jeans tend to run short first" },
  { id: "long_torso", label: "Long torso", hint: "Tops and jackets tend to run short in the body first" },
  { id: "long_arms", label: "Long arms", hint: "Sleeves tend to stop short first" },
  { id: "balanced", label: "Pretty balanced", hint: "Not sure, or fairly even" },
];

// Which garment categories actually get longer to fix each proportion —
// this is the tall-specific signal generic style quizzes don't ask.
const LEG_LENGTH_CATEGORIES = new Set(["Trousers", "Denim", "Cargo", "Activewear"]);
const TORSO_LENGTH_CATEGORIES = new Set(["Jacket", "Coat", "Blazer", "Knitwear", "Dress", "Shirt", "Hoodie"]);
const ARM_LENGTH_CATEGORIES = new Set(["Shirt", "Jacket", "Coat", "Blazer", "Knitwear", "Hoodie"]);

export type FitPreference = "slim" | "regular" | "relaxed" | "baggy" | "no_preference";

export const FIT_PREFERENCES: { id: FitPreference; label: string }[] = [
  { id: "slim", label: "Slim / fitted" },
  { id: "regular", label: "Regular / true to size" },
  { id: "relaxed", label: "Relaxed" },
  { id: "baggy", label: "Baggy / oversized" },
  { id: "no_preference", label: "No preference" },
];

export type BudgetBand = "under_50" | "50_100" | "100_200" | "200_plus";

export const BUDGET_BANDS: { id: BudgetBand; label: string; min: number; max: number | null }[] = [
  { id: "under_50", label: "Under $50", min: 0, max: 50 },
  { id: "50_100", label: "$50–100", min: 50, max: 100 },
  { id: "100_200", label: "$100–200", min: 100, max: 200 },
  { id: "200_plus", label: "$200+", min: 200, max: null },
];

export interface Product {
  id: string;
  name: string;
  retailer: string;
  retailerId: string;
  /** Where the retailer is based — drives the "Ships to EU" style hint and the EU-only filter. */
  retailerRegion: string | null;
  shippingCountries: string[];
  price: number;
  /** ISO code. Discovery can add European retailers billing in SEK, DKK, NOK, CHF or PLN, so this is not a closed set of five. */
  currency: string;
  tags: StyleTag[];
  /** Garment category shown on the placeholder swatch when there's no real photo yet. */
  category: string;
  /** Display label for tall sizing, e.g. `36" inseam`, "LT", "Big & Tall". */
  inseam?: string;
  /** Real fit measurements in cm, manually curated per product — not scrapable from retailer feeds, so coverage is partial. Null until verified. */
  inseamCm: number | null;
  sleeveCm: number | null;
  bodyLengthCm: number | null;
  fitNotes: string | null;
  fit: "slim" | "regular" | "relaxed" | "baggy";
  /** Outbound link to the actual retailer product page. */
  productUrl: string | null;
  /** First product photo, when one has been ingested — what a card shows. */
  imageUrl: string | null;
  /** Every ingested photo in display order. The detail screen pages through these. */
  imageUrls: string[];
  /** Identified from the product photo during review — null until classified, never guessed. */
  color: string | null;
  material: string | null;
  pattern: string | null;
  gender: "men" | "women" | "unisex" | null;
  /** When the product was ingested — drives the homepage's "newest finds" ordering. */
  createdAt: string;
}

// A product with no photo never reaches a screen: product_images is an inner
// join, so the database drops it rather than the app rendering a grey box with
// a link. The 18 that existed were all from the nine hand-entered non-Shopify
// retailers, which have no feed to pull an image from — there was no photo to
// go and fetch. They are set inactive too, so admin counts match what users see.
//
// Backed by Supabase (retailers/products/tall_sizes — see
// MARKET_RESEARCH.md §4.4 for the schema this implements) rather than a
// hardcoded list, so the catalog reflects the real worldwide retailer
// research instead of a handful of made-up entries.
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, price_cents, currency, style_tags, category, size_note, fit, inseam_cm, sleeve_cm, body_length_cm, fit_notes, product_url, color, material, pattern, gender, created_at, retailers(id, name, region, shipping_countries), product_images!inner(image_url, sort_order)"
    )
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const retailer = row.retailers as unknown as {
      id: string;
      name: string;
      region: string | null;
      shipping_countries: string[] | null;
    } | null;
    const imageUrls = [
      ...((row.product_images as unknown as { image_url: string; sort_order: number }[] | null) ?? []),
    ]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => i.image_url);
    return {
      id: row.id,
      name: row.name,
      retailer: retailer?.name ?? "Unknown retailer",
      retailerId: retailer?.id ?? "",
      retailerRegion: retailer?.region ?? null,
      shippingCountries: retailer?.shipping_countries ?? [],
      price: row.price_cents / 100,
      currency: row.currency as Product["currency"],
      tags: (row.style_tags ?? []) as StyleTag[],
      category: row.category,
      inseam: row.size_note ?? undefined,
      inseamCm: row.inseam_cm ?? null,
      sleeveCm: row.sleeve_cm ?? null,
      bodyLengthCm: row.body_length_cm ?? null,
      fitNotes: row.fit_notes ?? null,
      fit: (row.fit ?? "regular") as Product["fit"],
      productUrl: row.product_url,
      imageUrl: imageUrls[0] ?? null,
      imageUrls,
      color: row.color ?? null,
      material: row.material ?? null,
      pattern: row.pattern ?? null,
      gender: (row.gender ?? null) as Product["gender"],
      createdAt: row.created_at,
    };
  });
}

/**
 * The signed-in user's saved products. RLS restricts the table to own rows,
 * so no user filter is needed here — and adding one would only hide a policy
 * mistake rather than surface it.
 */
export async function getSavedProductIds(): Promise<Set<string>> {
  const { data, error } = await supabase.from("saved_products").select("product_id");
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.product_id as string));
}

export async function saveProduct(userId: string, productId: string): Promise<void> {
  const { error } = await supabase
    .from("saved_products")
    .upsert({ user_id: userId, product_id: productId }, { onConflict: "user_id,product_id" });
  if (error) throw error;
}

export async function unsaveProduct(userId: string, productId: string): Promise<void> {
  const { error } = await supabase
    .from("saved_products")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);
  if (error) throw error;
}

const CATALOG_HEALTH_TARGET = 300;

export interface CatalogHealth {
  totalProducts: number;
  productsWithPhotos: number;
  isHealthy: boolean;
}

/** Below CATALOG_HEALTH_TARGET, /feed shows a soft "still growing" note instead of pretending the catalog is done. */
export async function getCatalogHealth(): Promise<CatalogHealth> {
  const [{ count: totalProducts }, { count: productsWithPhotos }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("active", true),
    supabase
      .from("products")
      .select("id, product_images!inner(id)", { count: "exact", head: true })
      .eq("active", true),
  ]);

  return {
    totalProducts: totalProducts ?? 0,
    productsWithPhotos: productsWithPhotos ?? 0,
    isHealthy: (totalProducts ?? 0) >= CATALOG_HEALTH_TARGET,
  };
}

export async function getRetailerNames(): Promise<string[]> {
  const { data, error } = await supabase
    .from("retailers")
    .select("name")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((r) => r.name);
}

/** A sample of real-photo products for the onboarding swipe deck. */
export async function getSwipeDeckProducts(count = 9): Promise<Product[]> {
  const products = await getProducts();
  const withPhotos = products.filter((p) => p.imageUrl);
  return diversifyByRetailer(withPhotos).slice(0, count);
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  NZD: "NZ$",
  CAD: "C$",
  CHF: "CHF ",
  SEK: "kr ",
  DKK: "kr ",
  NOK: "kr ",
  PLN: "zł ",
};

/**
 * Falls back to the ISO code rather than a symbol. Retailer discovery now
 * reaches markets outside the original five, and an unknown currency used to
 * render the price as "undefined299" — a wrong price is worse than an
 * unfamiliar one.
 */
export function currencySymbol(currency: string) {
  return CURRENCY_SYMBOLS[currency] ?? `${currency} `;
}

export interface QuizAnswers {
  /** Style tags derived from what the user liked in the swipe deck. */
  swipeTags: StyleTag[];
  occasions: OccasionTag[];
  proportion?: Proportion;
  fitPreference?: FitPreference;
  budget?: BudgetBand;
}

export function answersToParams(answers: QuizAnswers): Record<string, string> {
  const params: Record<string, string> = {};
  if (answers.swipeTags.length) params.styles = answers.swipeTags.join(",");
  if (answers.occasions.length) params.occasions = answers.occasions.join(",");
  if (answers.proportion) params.proportion = answers.proportion;
  if (answers.fitPreference) params.fit = answers.fitPreference;
  if (answers.budget) params.budget = answers.budget;
  return params;
}

export function paramsToAnswers(params: {
  styles?: string;
  occasions?: string;
  proportion?: string;
  fit?: string;
  budget?: string;
}): QuizAnswers {
  return {
    swipeTags: (params.styles?.split(",").filter(Boolean) ?? []) as StyleTag[],
    occasions: (params.occasions?.split(",").filter(Boolean) ?? []) as OccasionTag[],
    proportion: params.proportion as Proportion | undefined,
    fitPreference: params.fit as FitPreference | undefined,
    budget: params.budget as BudgetBand | undefined,
  };
}

export interface SavedOnboarding extends QuizAnswers {
  heightRange: string | null;
}

/**
 * The user's most recent quiz answers, or null if they've never finished it.
 *
 * `onboarding_responses` is append-only — re-taking the quiz inserts a new row
 * rather than updating, so "current answers" is always the newest row. RLS
 * gates the table on `auth.uid() = user_id`, so this only returns rows for the
 * signed-in user. The client argument is a holdover from the web app, where
 * two different Supabase clients existed; on mobile there is only one, so
 * callers pass `supabase` from `@/lib/supabase`.
 */
export async function getLatestOnboardingResponse(
  client: SupabaseClient,
  userId: string
): Promise<SavedOnboarding | null> {
  const { data, error } = await client
    .from("onboarding_responses")
    .select("height_range, styles, occasions, proportion, fit_preference, budget")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to read onboarding response:", error.message);
    return null;
  }
  if (!data) return null;

  return {
    heightRange: data.height_range ?? null,
    swipeTags: (data.styles ?? []) as StyleTag[],
    occasions: (data.occasions ?? []) as OccasionTag[],
    proportion: (data.proportion ?? undefined) as Proportion | undefined,
    fitPreference: (data.fit_preference ?? undefined) as FitPreference | undefined,
    budget: (data.budget ?? undefined) as BudgetBand | undefined,
  };
}

/**
 * Real multi-signal ranking: swipe-deck likes (weighted highest), occasion
 * picks (same tag vocabulary, lower weight), a proportion-driven category
 * boost (the tall-specific signal — see LEG/TORSO_LENGTH_CATEGORIES above),
 * a fit-preference match, and a budget-band match. Groups products into
 * score tiers (highest first — real filtering, not just a tiebreak) and
 * diversifies retailers within each tier so one heavily-photographed brand
 * can't dominate the top regardless of which answers were picked.
 */
export function rankProducts(products: Product[], answers: QuizAnswers): Product[] {
  const tagWeights = new Map<StyleTag, number>();
  for (const t of answers.swipeTags) tagWeights.set(t, (tagWeights.get(t) ?? 0) + 2);
  for (const occasion of answers.occasions) {
    const mapped = OCCASION_TAGS.find((o) => o.id === occasion)?.mapsTo ?? [];
    for (const t of mapped) tagWeights.set(t, (tagWeights.get(t) ?? 0) + 1);
  }

  const budgetBand = answers.budget ? BUDGET_BANDS.find((b) => b.id === answers.budget) : undefined;

  const scoreOf = (p: Product) => {
    let score = 0;
    for (const t of p.tags) score += tagWeights.get(t) ?? 0;

    if (answers.proportion === "long_legs" && LEG_LENGTH_CATEGORIES.has(p.category)) score += 2;
    if (answers.proportion === "long_torso" && TORSO_LENGTH_CATEGORIES.has(p.category)) score += 2;
    if (answers.proportion === "long_arms" && ARM_LENGTH_CATEGORIES.has(p.category)) score += 2;

    if (
      answers.fitPreference &&
      answers.fitPreference !== "no_preference" &&
      p.fit === answers.fitPreference
    ) {
      score += 2;
    }

    if (budgetBand && p.price >= budgetBand.min && (budgetBand.max === null || p.price < budgetBand.max)) {
      score += 1;
    }

    return score;
  };

  const tiers = new Map<number, Product[]>();
  for (const product of products) {
    const score = scoreOf(product);
    if (!tiers.has(score)) tiers.set(score, []);
    tiers.get(score)!.push(product);
  }

  const scoresHighToLow = [...tiers.keys()].sort((a, b) => b - a);
  return scoresHighToLow.flatMap((score) => diversifyByRetailer(tiers.get(score)!));
}

export interface CatalogFilters {
  euOnly?: boolean;
  /** "Ships to Netherlands" — narrower than euOnly, since not every EU retailer ships to NL and some non-EU ones do. */
  shipsToNl?: boolean;
  minInseamCm?: number;
  minSleeveCm?: number;
  color?: string;
  material?: string;
  gender?: string;
}

/** Shared by /feed and /explore — narrows the catalog before ranking or display. */
export function applyCatalogFilters(products: Product[], filters: CatalogFilters): Product[] {
  return products.filter((p) => {
    if (filters.euOnly && p.retailerRegion !== "EU") return false;
    if (filters.shipsToNl && !p.shippingCountries.includes("NL")) return false;
    if (filters.minInseamCm && (!p.inseamCm || p.inseamCm < filters.minInseamCm)) return false;
    if (filters.minSleeveCm && (!p.sleeveCm || p.sleeveCm < filters.minSleeveCm)) return false;
    if (filters.color && p.color !== filters.color) return false;
    if (filters.material && p.material !== filters.material) return false;
    if (filters.gender && p.gender !== filters.gender) return false;
    return true;
  });
}

/** Distinct, sorted values for populating the Color/Material filter dropdowns — only what's actually classified, no fabricated options. */
export function distinctColors(products: Product[]): string[] {
  return [...new Set(products.map((p) => p.color).filter((c): c is string => !!c))].sort();
}

export function distinctMaterials(products: Product[]): string[] {
  return [...new Set(products.map((p) => p.material).filter((m): m is string => !!m))].sort();
}

export function diversifyByRetailer(products: Product[]): Product[] {
  const byRetailer = new Map<string, Product[]>();
  for (const p of products) {
    if (!byRetailer.has(p.retailer)) byRetailer.set(p.retailer, []);
    byRetailer.get(p.retailer)!.push(p);
  }
  // Real photos first within each retailer's own queue.
  for (const queue of byRetailer.values()) {
    queue.sort((a, b) => Number(!!b.imageUrl) - Number(!!a.imageUrl));
  }

  const retailers = [...byRetailer.keys()];
  const result: Product[] = [];
  let remaining = products.length;
  let i = 0;
  while (remaining > 0) {
    const queue = byRetailer.get(retailers[i % retailers.length])!;
    if (queue.length > 0) {
      result.push(queue.shift()!);
      remaining--;
    }
    i++;
  }
  return result;
}

/** One popularity score per product, from the `top_products` RPC. */
export interface ProductScore {
  productId: string;
  score: number;
}

/**
 * Below this, a score is noise rather than a signal. With a handful of taps in
 * the database, "most clicked" is really "whichever item someone opened once",
 * so anything weaker gets ignored and the fallback fills the slot instead.
 */
const MIN_POPULAR_SCORE = 3;

/**
 * The home page's picks: genuinely popular products first, topped up with new
 * arrivals when there isn't enough real signal yet.
 *
 * Three rules, each from something that actually goes wrong without it:
 *
 * - **Must have a photo.** The two highest-scoring products right now are
 *   hand-entered placeholders with no image, and a grey box is the worst thing
 *   to lead a shop window with. The website filtered on this for the same reason.
 * - **One per retailer among the popular picks.** The next two are the same
 *   blazer in two colours; four near-identical items doesn't show any range.
 * - **Topped up to the user's taste.** The slots popularity can't fill are
 *   filled by the same ranking Search and Explore use, so someone who answered
 *   the quiz sees their own four rather than everyone's four. Without answers
 *   this falls back to newest-first, which is what the website did.
 *
 * Today that means roughly one popular pick and three matched to taste. As real
 * traffic accumulates the balance tips on its own, with nothing to change here.
 */
export function selectTopPicks(
  products: Product[],
  scores: ProductScore[],
  count = 4,
  answers: QuizAnswers = { swipeTags: [], occasions: [] }
): Product[] {
  const withPhoto = products.filter((p) => p.imageUrl);
  const byId = new Map(withPhoto.map((p) => [p.id, p]));

  const picked: Product[] = [];
  const pickedIds = new Set<string>();
  const seenRetailers = new Set<string>();

  for (const { productId, score } of [...scores].sort((a, b) => b.score - a.score)) {
    if (picked.length >= count) break;
    if (score < MIN_POPULAR_SCORE) continue;
    const product = byId.get(productId);
    if (!product || seenRetailers.has(product.retailer)) continue;
    picked.push(product);
    pickedIds.add(product.id);
    seenRetailers.add(product.retailer);
  }

  if (picked.length < count) {
    // Newest first, then ranked. Order matters: rankProducts groups into score
    // tiers and preserves the order it was given inside each one, so sorting by
    // date first means "best match, newest of those" rather than either alone.
    // With no answers every product scores zero, one tier holds everything, and
    // this reduces to the newest-first, retailer-diversified list the website
    // used — the previous behaviour, unchanged.
    //
    // Sorting by date is not optional: at this catalog size one sync writes ~89
    // rows with near-identical timestamps, so an unsorted pass is mostly one shop.
    const spread = rankProducts(
      [...withPhoto].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      answers
    );

    // Two passes. The first keeps the one-per-retailer rule, so topping up
    // can't quietly re-add the second colourway that the popular pass just
    // skipped. The second allows a repeat, but only when the catalog doesn't
    // hold four distinct retailers with photographed stock — with ten live
    // retailers that never runs today, and three varied picks would beat four
    // where two are the same brand anyway.
    for (const allowRepeatRetailer of [false, true]) {
      for (const product of spread) {
        if (picked.length >= count) break;
        if (pickedIds.has(product.id)) continue;
        if (!allowRepeatRetailer && seenRetailers.has(product.retailer)) continue;
        picked.push(product);
        pickedIds.add(product.id);
        seenRetailers.add(product.retailer);
      }
    }
  }

  return picked;
}

/**
 * Popularity has to come from an RPC: `product_events` is admin-only to read,
 * and RLS answers with zero rows rather than an error, so querying it here
 * would silently return nothing. The function exposes counts only — see the
 * migration for why that is safe to call with the public key.
 */
export async function getTopPicks(
  products: Product[],
  count = 4,
  answers: QuizAnswers = { swipeTags: [], occasions: [] }
): Promise<Product[]> {
  const { data, error } = await supabase.rpc("top_products", { p_limit: 12 });
  if (error) {
    // Popularity is an enhancement, not a requirement. Losing it should cost
    // the ranking, not the shop window.
    console.error("Couldn't read product popularity:", error.message);
    return selectTopPicks(products, [], count, answers);
  }

  const scores: ProductScore[] = (data ?? []).map(
    (row: { product_id: string; score: number }) => ({
      productId: row.product_id,
      score: Number(row.score),
    })
  );

  return selectTopPicks(products, scores, count, answers);
}

// Flat grayscale ramp (no warm tint, no gradient) — matches DESIGN.md's
// high-contrast poster system so a placeholder reads as deliberate, not a bug.
const SWATCH_PALETTE = ["#ECECEC", "#D6D6D6", "#B8B8B8", "#949494", "#6B6B6B", "#3A3A3A"];

export function swatchColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return SWATCH_PALETTE[hash % SWATCH_PALETTE.length];
}
