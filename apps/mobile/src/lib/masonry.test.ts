import { describe, expect, it } from "vitest";
import { assignToColumns, DEFAULT_ASPECT_RATIO } from "@/lib/masonry";

const items = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i}` }));

/** Total relative height of a column, the same way assignToColumns measures it. */
function heightOf(column: { id: string }[], ratios: Record<string, number>) {
  return column.reduce((sum, item) => sum + 1 / (ratios[item.id] ?? DEFAULT_ASPECT_RATIO) + 0.35, 0);
}

describe("assignToColumns", () => {
  it("keeps every item exactly once", () => {
    const columns = assignToColumns(items(20), {}, 3);
    const ids = columns.flat().map((i) => i.id);

    expect(ids).toHaveLength(20);
    expect(new Set(ids).size).toBe(20);
  });

  it("spreads evenly when every photo is the same shape", () => {
    const columns = assignToColumns(items(9), {}, 3);

    expect(columns.map((c) => c.length)).toEqual([3, 3, 3]);
  });

  it("puts the next item in the shortest column, not the next one round", () => {
    // A very tall first photo should leave column 0 skipped on the second pass.
    const ratios = { p0: 0.2 }; // tall and narrow
    const columns = assignToColumns(items(4), ratios, 3);

    expect(columns[0]).toHaveLength(1);
    expect(columns[0][0].id).toBe("p0");
  });

  it("ends with columns of comparable height for mixed shapes", () => {
    const ratios: Record<string, number> = {};
    items(30).forEach((item, i) => {
      // Alternating wide, square and tall.
      ratios[item.id] = [1.6, 1, 0.6][i % 3];
    });

    const columns = assignToColumns(items(30), ratios, 3);
    const heights = columns.map((c) => heightOf(c, ratios));
    const spread = Math.max(...heights) - Math.min(...heights);

    // Within one average card of each other — greedy packing can't do better,
    // and anything looser reads as three lists rather than one feed.
    const averageCard = heights.reduce((a, b) => a + b, 0) / 30;
    expect(spread).toBeLessThan(averageCard * 1.5);
  });

  it("reads in ranked order down each column", () => {
    const columns = assignToColumns(items(9), {}, 3);

    for (const column of columns) {
      const indices = column.map((item) => Number(item.id.slice(1)));
      expect([...indices].sort((a, b) => a - b)).toEqual(indices);
    }
  });

  it("ignores a broken ratio rather than parking a column forever", () => {
    // A zero would divide into Infinity and that column would never be chosen
    // again, leaving one third of the feed empty below the first item.
    const columns = assignToColumns(items(9), { p0: 0 }, 3);

    expect(columns.every((c) => c.length > 0)).toBe(true);
    expect(columns.flat()).toHaveLength(9);
  });

  it("handles fewer items than columns", () => {
    const columns = assignToColumns(items(2), {}, 3);

    expect(columns).toHaveLength(3);
    expect(columns.flat()).toHaveLength(2);
  });

  it("handles an empty feed", () => {
    expect(assignToColumns([], {}, 3).flat()).toEqual([]);
  });
});
