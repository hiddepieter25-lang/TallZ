import { describe, expect, it } from "vitest";
import {
  answersToParams,
  applyCatalogFilters,
  currencySymbol,
  distinctColors,
  distinctMaterials,
  diversifyByRetailer,
  paramsToAnswers,
  rankProducts,
  swatchColor,
  type Product,
  type QuizAnswers,
} from "@/lib/products";

/**
 * These cover the pure half of the domain core: ranking, filtering, and the
 * quiz round-trip. Nothing here touches Supabase.
 *
 * They assert *behaviour* — "a swiped tag outranks an occasion tag" — rather
 * than exact scores. Pinning the numbers would make every future tweak to the
 * algorithm look like a regression, which is precisely when these tests need to
 * still be readable.
 */

let seq = 0;
function product(overrides: Partial<Product> = {}): Product {
  seq += 1;
  return {
    id: `p${seq}`,
    name: `Product ${seq}`,
    retailer: "Retailer A",
    retailerId: "r1",
    retailerRegion: "EU",
    shippingCountries: ["NL"],
    price: 75,
    currency: "EUR",
    tags: [],
    category: "Shirt",
    inseamCm: null,
    sleeveCm: null,
    bodyLengthCm: null,
    fitNotes: null,
    fit: "regular",
    productUrl: "https://example.com/p",
    imageUrl: "https://example.com/p.jpg",
    color: null,
    material: null,
    pattern: null,
    gender: null,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const noAnswers: QuizAnswers = { swipeTags: [], occasions: [] };

/** Position of a product in the ranked list, by id. */
function rankOf(ranked: Product[], id: string) {
  return ranked.findIndex((p) => p.id === id);
}

describe("rankProducts", () => {
  it("puts a product matching a swiped style above one that matches nothing", () => {
    const match = product({ id: "match", tags: ["denim"] });
    const other = product({ id: "other", tags: [] });

    const ranked = rankProducts([other, match], { swipeTags: ["denim"], occasions: [] });

    expect(rankOf(ranked, "match")).toBeLessThan(rankOf(ranked, "other"));
  });

  it("weights a swiped tag above an occasion tag", () => {
    // "work" maps to "workwear", so both products match something — but the
    // swipe is the stronger signal and has to win.
    const swiped = product({ id: "swiped", tags: ["denim"] });
    const viaOccasion = product({ id: "occasion", tags: ["workwear"] });

    const ranked = rankProducts([viaOccasion, swiped], {
      swipeTags: ["denim"],
      occasions: ["work"],
    });

    expect(rankOf(ranked, "swiped")).toBeLessThan(rankOf(ranked, "occasion"));
  });

  it("maps an occasion onto its style tags", () => {
    // "active" maps to "athleisure" — nothing in the answers names that tag
    // directly, so this only ranks if the mapping is applied.
    const athleisure = product({ id: "athleisure", tags: ["athleisure"] });
    const evening = product({ id: "evening", tags: ["evening"] });

    const ranked = rankProducts([evening, athleisure], { swipeTags: [], occasions: ["active"] });

    expect(rankOf(ranked, "athleisure")).toBeLessThan(rankOf(ranked, "evening"));
  });

  it("counts an occasion mapping to two tags for both of them", () => {
    // "weekend" maps to denim + streetwear.
    const denim = product({ id: "denim", tags: ["denim"] });
    const street = product({ id: "street", tags: ["streetwear"] });
    const neither = product({ id: "neither", tags: ["evening"] });

    const ranked = rankProducts([neither, denim, street], {
      swipeTags: [],
      occasions: ["weekend"],
    });

    expect(rankOf(ranked, "neither")).toBe(2);
  });

  it("boosts leg-length categories for long legs", () => {
    const trousers = product({ id: "trousers", category: "Trousers" });
    const shirt = product({ id: "shirt", category: "Shirt" });

    const ranked = rankProducts([shirt, trousers], { ...noAnswers, proportion: "long_legs" });

    expect(rankOf(ranked, "trousers")).toBeLessThan(rankOf(ranked, "shirt"));
  });

  it("boosts torso-length categories for a long torso — the opposite of long legs", () => {
    const trousers = product({ id: "trousers", category: "Trousers" });
    const coat = product({ id: "coat", category: "Coat" });

    const ranked = rankProducts([trousers, coat], { ...noAnswers, proportion: "long_torso" });

    expect(rankOf(ranked, "coat")).toBeLessThan(rankOf(ranked, "trousers"));
  });

  it("boosts a product whose fit matches the stated preference", () => {
    const baggy = product({ id: "baggy", fit: "baggy" });
    const slim = product({ id: "slim", fit: "slim" });

    const ranked = rankProducts([slim, baggy], { ...noAnswers, fitPreference: "baggy" });

    expect(rankOf(ranked, "baggy")).toBeLessThan(rankOf(ranked, "slim"));
  });

  it("ignores fit when the answer is no_preference", () => {
    const slim = product({ id: "slim", fit: "slim", retailer: "A" });
    const baggy = product({ id: "baggy", fit: "baggy", retailer: "A" });

    const ranked = rankProducts([slim, baggy], { ...noAnswers, fitPreference: "no_preference" });

    // Same score, so original order survives within the tier.
    expect(ranked.map((p) => p.id)).toEqual(["slim", "baggy"]);
  });

  it("boosts a product inside the chosen budget band", () => {
    const inBand = product({ id: "in", price: 75 });
    const tooDear = product({ id: "out", price: 300 });

    const ranked = rankProducts([tooDear, inBand], { ...noAnswers, budget: "50_100" });

    expect(rankOf(ranked, "in")).toBeLessThan(rankOf(ranked, "out"));
  });

  it("treats a budget band as inclusive at the bottom and exclusive at the top", () => {
    // 50_100 is min 50, max 100. 100 belongs to the next band, not this one.
    const atMin = product({ id: "at-min", price: 50 });
    const atMax = product({ id: "at-max", price: 100 });

    const ranked = rankProducts([atMax, atMin], { ...noAnswers, budget: "50_100" });

    expect(rankOf(ranked, "at-min")).toBeLessThan(rankOf(ranked, "at-max"));
  });

  it("has no top band ceiling for 200_plus", () => {
    const veryExpensive = product({ id: "expensive", price: 5000 });
    const cheap = product({ id: "cheap", price: 10 });

    const ranked = rankProducts([cheap, veryExpensive], { ...noAnswers, budget: "200_plus" });

    expect(rankOf(ranked, "expensive")).toBeLessThan(rankOf(ranked, "cheap"));
  });

  it("adds signals together, so two weak matches outrank one", () => {
    const twoSignals = product({ id: "two", tags: ["denim"], fit: "baggy" });
    const oneSignal = product({ id: "one", tags: ["denim"], fit: "slim" });

    const ranked = rankProducts([oneSignal, twoSignals], {
      swipeTags: ["denim"],
      occasions: [],
      fitPreference: "baggy",
    });

    expect(rankOf(ranked, "two")).toBeLessThan(rankOf(ranked, "one"));
  });

  it("returns every product it was given, never drops any", () => {
    const products = [
      product({ id: "a", tags: ["denim"] }),
      product({ id: "b", retailer: "B" }),
      product({ id: "c", retailer: "C", category: "Trousers" }),
    ];

    const ranked = rankProducts(products, {
      swipeTags: ["denim"],
      occasions: ["work"],
      proportion: "long_legs",
    });

    expect(ranked).toHaveLength(3);
    expect([...ranked].map((p) => p.id).sort()).toEqual(["a", "b", "c"]);
  });

  it("handles an empty catalog", () => {
    expect(rankProducts([], noAnswers)).toEqual([]);
  });
});

describe("diversifyByRetailer", () => {
  it("alternates retailers instead of grouping them", () => {
    const products = [
      product({ id: "a1", retailer: "A" }),
      product({ id: "a2", retailer: "A" }),
      product({ id: "a3", retailer: "A" }),
      product({ id: "b1", retailer: "B" }),
      product({ id: "c1", retailer: "C" }),
    ];

    const order = diversifyByRetailer(products).map((p) => p.retailer);

    expect(order.slice(0, 3)).toEqual(["A", "B", "C"]);
  });

  it("puts products with a real photo first within one retailer's queue", () => {
    const products = [
      product({ id: "no-photo", retailer: "A", imageUrl: null }),
      product({ id: "photo", retailer: "A", imageUrl: "https://example.com/x.jpg" }),
    ];

    expect(diversifyByRetailer(products).map((p) => p.id)).toEqual(["photo", "no-photo"]);
  });

  it("keeps every product when one retailer has far more than the others", () => {
    const products = [
      ...Array.from({ length: 5 }, (_, i) => product({ id: `a${i}`, retailer: "A" })),
      product({ id: "b0", retailer: "B" }),
    ];

    expect(diversifyByRetailer(products)).toHaveLength(6);
  });

  it("returns an empty list unchanged rather than looping forever", () => {
    expect(diversifyByRetailer([])).toEqual([]);
  });
});

describe("applyCatalogFilters", () => {
  const eu = product({ id: "eu", retailerRegion: "EU", shippingCountries: ["NL", "DE"] });
  const us = product({ id: "us", retailerRegion: "US", shippingCountries: ["US"] });
  const usShipsNl = product({ id: "us-nl", retailerRegion: "US", shippingCountries: ["US", "NL"] });
  const all = [eu, us, usShipsNl];

  it("returns everything when no filter is set", () => {
    expect(applyCatalogFilters(all, {})).toHaveLength(3);
  });

  it("euOnly keeps EU-based retailers", () => {
    expect(applyCatalogFilters(all, { euOnly: true }).map((p) => p.id)).toEqual(["eu"]);
  });

  it("shipsToNl is not the same as euOnly — a US retailer can still ship to NL", () => {
    expect(applyCatalogFilters(all, { shipsToNl: true }).map((p) => p.id)).toEqual(["eu", "us-nl"]);
  });

  it("drops products with no measurement when a minimum is set", () => {
    const measured = product({ id: "measured", inseamCm: 90 });
    const unknown = product({ id: "unknown", inseamCm: null });

    const kept = applyCatalogFilters([measured, unknown], { minInseamCm: 85 });

    expect(kept.map((p) => p.id)).toEqual(["measured"]);
  });

  it("treats a minimum as inclusive", () => {
    const exact = product({ id: "exact", sleeveCm: 70 });

    expect(applyCatalogFilters([exact], { minSleeveCm: 70 })).toHaveLength(1);
  });

  it("filters on colour, material and gender", () => {
    const target = product({ id: "target", color: "Black", material: "Wool", gender: "men" });
    const miss = product({ id: "miss", color: "Blue", material: "Cotton", gender: "women" });

    expect(
      applyCatalogFilters([target, miss], { color: "Black", material: "Wool", gender: "men" })
        .map((p) => p.id)
    ).toEqual(["target"]);
  });

  it("stacks filters — a product must satisfy all of them", () => {
    const half = product({ id: "half", retailerRegion: "EU", color: "Blue" });

    expect(applyCatalogFilters([half], { euOnly: true, color: "Black" })).toEqual([]);
  });
});

describe("quiz answers round-trip", () => {
  it("survives the trip to URL params and back", () => {
    const answers: QuizAnswers = {
      swipeTags: ["denim", "minimal"],
      occasions: ["work", "weekend"],
      proportion: "long_legs",
      fitPreference: "relaxed",
      budget: "50_100",
    };

    expect(paramsToAnswers(answersToParams(answers))).toEqual(answers);
  });

  it("omits empty values instead of writing blank params", () => {
    expect(answersToParams(noAnswers)).toEqual({});
  });

  it("reads absent params as empty answers, not undefined arrays", () => {
    const answers = paramsToAnswers({});

    expect(answers.swipeTags).toEqual([]);
    expect(answers.occasions).toEqual([]);
    expect(answers.proportion).toBeUndefined();
  });

  it("does not produce an empty-string tag from a trailing comma", () => {
    expect(paramsToAnswers({ styles: "denim," }).swipeTags).toEqual(["denim"]);
  });
});

describe("small helpers", () => {
  it("maps every supported currency to a symbol", () => {
    expect(currencySymbol("USD")).toBe("$");
    expect(currencySymbol("EUR")).toBe("€");
    expect(currencySymbol("GBP")).toBe("£");
    expect(currencySymbol("AUD")).toBe("A$");
    expect(currencySymbol("NZD")).toBe("NZ$");
  });

  it("lists distinct colours sorted, dropping unclassified ones", () => {
    const products = [
      product({ color: "Navy" }),
      product({ color: "Black" }),
      product({ color: "Navy" }),
      product({ color: null }),
    ];

    expect(distinctColors(products)).toEqual(["Black", "Navy"]);
  });

  it("does the same for materials", () => {
    const products = [product({ material: "Wool" }), product({ material: null })];

    expect(distinctMaterials(products)).toEqual(["Wool"]);
  });

  it("gives the same seed the same swatch colour every time", () => {
    expect(swatchColor("Trousers")).toBe(swatchColor("Trousers"));
  });

  it("always returns a colour from the palette, even for an empty seed", () => {
    expect(swatchColor("")).toMatch(/^#[0-9A-F]{6}$/i);
  });
});
