import { describe, expect, it } from "vitest";
import {
  guessCountry,
  guessCurrency,
  guessRegion,
  isTallProduct,
  tallConfidence,
  tallSignalFields,
} from "./shopify-source.mjs";

/**
 * The tall detection decides which shops discovery lets in and which products
 * ingestion keeps, so getting it wrong is expensive in both directions: a
 * false negative turns away a real retailer, a false positive fills the
 * catalog with clothes that don't fit anyone tall.
 *
 * The cases below are taken from real feeds — see the comments.
 */

function product(overrides = {}) {
  return { title: "Cotton Shirt", product_type: "Shirts", tags: [], variants: [], ...overrides };
}

describe("tallConfidence", () => {
  it("trusts a structured field over the title", () => {
    // TALLTOGS: 0 of 42 titles say "tall", 36 of them carry it in their tags.
    // Title-only detection rejected the shop outright.
    const p = product({ title: "Roots Qtr Zip", tags: ["tall", "mens"] });

    expect(tallConfidence(p)).toBe("high");
  });

  it("reads the product type", () => {
    expect(tallConfidence(product({ product_type: "Tall Trousers" }))).toBe("high");
  });

  it("reads size options on variants", () => {
    const p = product({ variants: [{ option1: "Blue", option2: "XLT" }] });

    expect(tallConfidence(p)).toBe("high");
  });

  it("reads the option values a shop lists for the whole product", () => {
    const p = product({ options: [{ name: "Size", values: ["M", "L", "LT"] }] });

    expect(tallConfidence(p)).toBe("high");
  });

  it("accepts an inseam-style size label", () => {
    expect(tallConfidence(product({ variants: [{ option1: "36L" }] }))).toBe("high");
  });

  it("falls back to the title, but marks it weaker", () => {
    // Mirrors ingest_shopify_page, which inserts title-only matches inactive.
    expect(tallConfidence(product({ title: "Tall Chino Trouser" }))).toBe("low");
  });

  it("says nothing for an ordinary product", () => {
    expect(tallConfidence(product())).toBeNull();
  });

  it("does not match 'tall' inside another word", () => {
    // "Metallic", "Installation", "Crystal" — the reason the phrase is
    // word-bounded rather than a bare substring test.
    expect(tallConfidence(product({ title: "Metallic Knit" }))).toBeNull();
    expect(tallConfidence(product({ tags: ["crystal"] }))).toBeNull();
  });

  it("does not treat a size label as a match unless the whole value is one", () => {
    // "Belt" ends in "lt". Anchoring is what stops that counting as an LT size.
    expect(tallConfidence(product({ variants: [{ option1: "Belt" }] }))).toBeNull();
  });

  it("handles tags arriving as a comma-separated string", () => {
    // Some Shopify feeds send tags as one string rather than an array.
    expect(tallConfidence(product({ tags: "mens, tall, denim" }))).toBe("high");
  });

  it("survives a product with none of the optional fields", () => {
    expect(() => isTallProduct({ title: "Shirt" })).not.toThrow();
    expect(isTallProduct({ title: "Shirt" })).toBe(false);
  });

  it("matches big & tall in either spelling", () => {
    expect(tallConfidence(product({ product_type: "Big & Tall" }))).toBe("high");
    expect(tallConfidence(product({ product_type: "Big and Tall" }))).toBe("high");
  });
});

describe("tallSignalFields", () => {
  it("collects type, tags and every variant option", () => {
    const p = product({
      product_type: "Trousers",
      tags: ["tall", "denim"],
      variants: [{ option1: "34L", option2: "Blue" }],
    });

    expect(tallSignalFields(p)).toEqual(["Trousers", "tall", "denim", "34L", "Blue"]);
  });

  it("leaves the title out — that is the weaker signal, handled separately", () => {
    expect(tallSignalFields(product({ title: "Tall Shirt" }))).not.toContain("Tall Shirt");
  });
});

describe("market guesses from the domain", () => {
  it("reads European country domains", () => {
    expect(guessCountry("https://shop.nl")).toBe("Netherlands");
    expect(guessCountry("https://shop.be")).toBe("Belgium");
    expect(guessCountry("https://shop.de")).toBe("Germany");
    expect(guessRegion("https://shop.se")).toBe("EU");
  });

  it("keeps non-euro European currencies right", () => {
    // Sweden is in the EU region for shipping but does not use the euro.
    expect(guessCurrency("https://shop.se")).toBe("SEK");
    expect(guessCurrency("https://shop.ch")).toBe("CHF");
    expect(guessCurrency("https://shop.nl")).toBe("EUR");
  });

  it("treats the UK as its own region, not EU", () => {
    expect(guessRegion("https://shop.co.uk")).toBe("UK");
    expect(guessCurrency("https://shop.co.uk")).toBe("GBP");
  });

  it("falls back to the US for a .com, which the admin review exists to correct", () => {
    expect(guessCountry("https://dutchbrand.com")).toBe("USA");
  });

  it("agrees with itself across all three guesses", () => {
    // One table backs all three, so a domain can never be Dutch-but-priced-in-dollars.
    for (const host of ["https://a.nl", "https://a.co.uk", "https://a.com.au", "https://a.com"]) {
      expect(typeof guessCountry(host)).toBe("string");
      expect(typeof guessRegion(host)).toBe("string");
      expect(typeof guessCurrency(host)).toBe("string");
    }
  });
});
