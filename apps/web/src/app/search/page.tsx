import { MasonryFeed, type MasonryItem } from "@/components/MasonryFeed";
import { getImageDimensionsBatch } from "@/lib/image-dimensions";
import { getProducts } from "@/lib/products";

const FALLBACK_RATIO = { width: 4, height: 5 };

// Search is the primary discovery flow (see CLAUDEMODE.md) — this is where
// the nav search box and the homepage search section both point.
export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const allProducts = await getProducts();
  const query = (q ?? "").trim().toLowerCase();
  const products = query
    ? allProducts.filter(
        (p) => p.name.toLowerCase().includes(query) || p.retailer.toLowerCase().includes(query)
      )
    : [];

  const imageUrls = products.map((p) => p.imageUrl).filter((url): url is string => !!url);
  const dimensions = await getImageDimensionsBatch(imageUrls);
  const items: MasonryItem[] = products.map((product) => {
    const dims = product.imageUrl ? dimensions.get(product.imageUrl) : undefined;
    return { product, width: dims?.width ?? FALLBACK_RATIO.width, height: dims?.height ?? FALLBACK_RATIO.height };
  });

  return (
    <div className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-14 sm:px-8">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-orange">Search</p>
      <h1 className="mb-10 text-3xl font-bold tracking-tight">
        {query ? `"${q}"` : "search the catalog"}
      </h1>

      {query && items.length === 0 && (
        <p className="text-sm text-muted">No products match &quot;{q}&quot;.</p>
      )}
      {!query && (
        <p className="text-sm text-muted">
          Type a brand or product name in the search box above.
        </p>
      )}

      {items.length > 0 && <MasonryFeed items={items} placement="explore" />}
    </div>
  );
}
