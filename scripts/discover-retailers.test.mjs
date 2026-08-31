import { describe, expect, it } from "vitest";
import { weekIndex, queriesForWeek } from "./discover-retailers.mjs";

/**
 * The rotation is the difference between discovery finding retailers once and
 * finding them every week. Three fixed queries returned the same Google results
 * every run, and by the second run every hit was already known or rejected.
 */

const BANK = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];

describe("queriesForWeek", () => {
  it("gives consecutive weeks different queries", () => {
    const week1 = queriesForWeek(1, BANK, 3);
    const week2 = queriesForWeek(2, BANK, 3);

    expect(week1).not.toEqual(week2);
    expect(week1.some((q) => week2.includes(q))).toBe(false);
  });

  it("returns the number asked for", () => {
    expect(queriesForWeek(0, BANK, 3)).toHaveLength(3);
    expect(queriesForWeek(7, BANK, 6)).toHaveLength(6);
  });

  it("is deterministic — the same week always gives the same set", () => {
    // Deliberately not random: when a run turns up something odd, it has to be
    // reproducible to work out which query found it.
    expect(queriesForWeek(5, BANK, 3)).toEqual(queriesForWeek(5, BANK, 3));
  });

  it("wraps around the end of the bank instead of running out", () => {
    const picked = queriesForWeek(2, BANK, 4); // starts at index 8 of 9

    expect(picked).toHaveLength(4);
    expect(new Set(picked).size).toBe(4);
  });

  it("works through the whole bank over enough weeks", () => {
    const seen = new Set();
    for (let week = 0; week < 20; week++) {
      for (const q of queriesForWeek(week, BANK, 3)) seen.add(q);
    }

    expect(seen.size).toBe(BANK.length);
  });

  it("never asks for more than the bank holds", () => {
    expect(queriesForWeek(0, ["only"], 6)).toEqual(["only"]);
  });

  it("uses the real bank by default and picks six", () => {
    expect(queriesForWeek(0)).toHaveLength(6);
  });

  it("covers more than one language in the real bank", () => {
    // Europe-weighted by choice: the catalog is almost entirely American, and
    // the first users are not.
    const allQueries = Array.from({ length: 8 }, (_, w) => queriesForWeek(w)).flat();

    expect(allQueries.some((q) => q.includes("lange maten"))).toBe(true);
    expect(allQueries.some((q) => q.includes("grosse"))).toBe(true);
  });
});

describe("weekIndex", () => {
  it("advances by one after seven days", () => {
    const a = new Date("2026-03-02T00:00:00Z"); // Monday
    const b = new Date("2026-03-09T00:00:00Z"); // the next Monday

    expect(weekIndex(b)).toBe(weekIndex(a) + 1);
  });

  it("puts the boundary on Monday, where the schedule is", () => {
    const sunday = new Date("2026-03-08T23:59:00Z");
    const monday = new Date("2026-03-09T00:01:00Z");

    expect(weekIndex(monday)).toBe(weekIndex(sunday) + 1);
  });

  it("does not change within the same week", () => {
    expect(weekIndex(new Date("2026-03-02T00:00:00Z"))).toBe(
      weekIndex(new Date("2026-03-05T12:00:00Z"))
    );
  });
});
