import probe from "probe-image-size";

export interface ImageDimensions {
  width: number;
  height: number;
}

/** Sensible default for a fashion product photo when probing fails — used so a card still lays out reasonably. */
const FALLBACK_RATIO: ImageDimensions = { width: 4, height: 5 };

// In-memory only — cleared on server restart. Good enough for a low-traffic
// site; avoids re-probing the same (stable, retailer-hosted) URLs on every
// page load without needing a schema change to persist dimensions.
const cache = new Map<string, ImageDimensions>();

/** Reads just enough of the remote image to get its real dimensions — no full download. */
export async function getImageDimensions(url: string): Promise<ImageDimensions> {
  const cached = cache.get(url);
  if (cached) return cached;

  try {
    const result = await probe(url);
    const dims = { width: result.width, height: result.height };
    cache.set(url, dims);
    return dims;
  } catch {
    return FALLBACK_RATIO;
  }
}

export async function getImageDimensionsBatch(
  urls: string[]
): Promise<Map<string, ImageDimensions>> {
  const unique = [...new Set(urls)];
  const results = await Promise.all(unique.map((u) => getImageDimensions(u)));
  return new Map(unique.map((u, i) => [u, results[i]]));
}
