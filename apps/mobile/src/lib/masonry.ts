/**
 * Column assignment for the masonry feed.
 *
 * Kept out of the component and free of React Native imports so it can be
 * tested: the balancing is the part that goes wrong, and "the columns drifted"
 * is not something a screenshot review reliably catches.
 */

/** Height of the meta block under a photo, relative to the card's width. */
const META_HEIGHT_RATIO = 0.35;

/** Assumed shape before a photo has loaded and reported its real one. */
export const DEFAULT_ASPECT_RATIO = 3 / 4;

/**
 * Places each item in whichever column is currently shortest.
 *
 * Heights are relative, not pixels: every column is the same width, so
 * `1 / aspectRatio` (height per unit width) compares directly across columns
 * without knowing how wide they actually are.
 *
 * Order within a column follows the input order, so a ranked list stays ranked
 * as you read down — the eye still gets the best matches first.
 */
export function assignToColumns<T extends { id: string }>(
  items: T[],
  ratios: Record<string, number>,
  columnCount: number
): T[][] {
  if (columnCount < 1) return [];

  const columns: T[][] = Array.from({ length: columnCount }, () => []);
  const heights = new Array<number>(columnCount).fill(0);

  for (const item of items) {
    let shortest = 0;
    for (let i = 1; i < columnCount; i++) {
      if (heights[i] < heights[shortest]) shortest = i;
    }

    columns[shortest].push(item);

    const ratio = ratios[item.id];
    // A zero or negative ratio would divide into Infinity and park that column
    // permanently at the back; a broken measurement shouldn't reshape the feed.
    const safeRatio = ratio && ratio > 0 ? ratio : DEFAULT_ASPECT_RATIO;
    heights[shortest] += 1 / safeRatio + META_HEIGHT_RATIO;
  }

  return columns;
}
