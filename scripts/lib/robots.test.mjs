import { describe, expect, it } from "vitest";
import { isPathAllowed, parseRobots } from "./robots.mjs";

/**
 * These decide whether a retailer gets into the catalog at all, so a parsing
 * mistake either turns away shops that said yes or reads a "no" as a "yes".
 * The precedence rules come from RFC 9309.
 */

function allows(robotsTxt, path = "/products.json") {
  return isPathAllowed(parseRobots(robotsTxt), path);
}

describe("parseRobots + isPathAllowed", () => {
  it("allows everything when the file is empty", () => {
    expect(allows("")).toBe(true);
  });

  it("honours a blanket disallow", () => {
    expect(allows("User-agent: *\nDisallow: /")).toBe(false);
  });

  it("honours a disallow aimed at the product feed", () => {
    expect(allows("User-agent: *\nDisallow: /products.json")).toBe(false);
  });

  it("leaves unrelated disallows alone", () => {
    expect(allows("User-agent: *\nDisallow: /admin\nDisallow: /cart")).toBe(true);
  });

  it("treats an empty Disallow as allowing everything", () => {
    // "Disallow:" with no value is the documented way to say "no restrictions".
    // Read as a pattern it would match every path and lock the whole site out.
    expect(allows("User-agent: *\nDisallow:")).toBe(true);
  });

  it("lets a longer Allow override a broader Disallow", () => {
    expect(allows("User-agent: *\nDisallow: /\nAllow: /products.json")).toBe(true);
  });

  it("lets a longer Disallow override a broader Allow", () => {
    expect(allows("User-agent: *\nAllow: /\nDisallow: /products.json")).toBe(false);
  });

  it("prefers Allow when two rules are equally specific", () => {
    expect(allows("User-agent: *\nDisallow: /products.json\nAllow: /products.json")).toBe(true);
  });

  it("applies a group naming us over the wildcard group", () => {
    const txt = [
      "User-agent: *",
      "Disallow: /",
      "",
      "User-agent: tallz-product-research",
      "Allow: /",
    ].join("\n");

    expect(allows(txt)).toBe(true);
  });

  it("obeys a block aimed specifically at us even when the wildcard is open", () => {
    const txt = [
      "User-agent: *",
      "Allow: /",
      "",
      "User-agent: tallz-product-research",
      "Disallow: /",
    ].join("\n");

    expect(allows(txt)).toBe(false);
  });

  it("ignores rules written for some other bot", () => {
    const txt = ["User-agent: GPTBot", "Disallow: /", "", "User-agent: *", "Allow: /"].join("\n");

    expect(allows(txt)).toBe(true);
  });

  it("shares one rule block between consecutive user-agent lines", () => {
    const txt = ["User-agent: AhrefsBot", "User-agent: *", "Disallow: /products.json"].join("\n");

    expect(allows(txt)).toBe(false);
  });

  it("handles wildcards inside a path", () => {
    expect(allows("User-agent: *\nDisallow: /*.json")).toBe(false);
    expect(allows("User-agent: *\nDisallow: /*.xml")).toBe(true);
  });

  it("honours an end-of-path anchor", () => {
    expect(allows("User-agent: *\nDisallow: /products.json$")).toBe(false);
    expect(allows("User-agent: *\nDisallow: /products$", "/products.json")).toBe(true);
  });

  it("does not let a dot in a pattern act as a wildcard", () => {
    // "/productsXjson" must not be matched by the pattern "/products.json".
    expect(isPathAllowed(parseRobots("User-agent: *\nDisallow: /products.json"), "/productsXjson")).toBe(
      true
    );
  });

  it("ignores comments and blank lines", () => {
    const txt = ["# our robots file", "", "User-agent: *   # everyone", "Disallow: /  # everything"].join(
      "\n"
    );

    expect(allows(txt)).toBe(false);
  });

  it("is case-insensitive about field names and agent names", () => {
    expect(allows("USER-AGENT: *\nDISALLOW: /products.json")).toBe(false);
    expect(allows("User-agent: TALLZ-PRODUCT-RESEARCH\nDisallow: /")).toBe(false);
  });

  it("ignores rules written before any user-agent line", () => {
    expect(allows("Disallow: /\nUser-agent: *\nAllow: /")).toBe(true);
  });

  it("skips lines that aren't field: value", () => {
    expect(allows("this is not a rule\nUser-agent: *\nDisallow: /products.json")).toBe(false);
  });
});
