import { MasonryFeed, type MasonryItem } from "@/components/MasonryFeed";
import { CatalogFilterBar } from "@/components/CatalogFilterBar";
import { getImageDimensionsBatch } from "@/lib/image-dimensions";
import {
  applyCatalogFilters,
  distinctColors,
  distinctMaterials,
  getCatalogHealth,
  getProducts,
  paramsToAnswers,
  rankProducts,
  STYLE_TAGS,
} from "@/lib/products";

const FALLBACK_RATIO = { width: 4, height: 5 };

export default async function Feed({
  searchParams,
}: {
  searchParams: Promise<{
    styles?: string;
    occasions?: string;
    proportion?: string;
    fit?: string;
    budget?: string;
    height?: string;
    eu?: string;
    minInseam?: string;
    minSleeve?: string;
    color?: string;
    material?: string;
    gender?: string;
  }>;
}) {
  const [params, allProducts, health] = await Promise.all([
    searchParams,
    getProducts(),
    getCatalogHealth(),
  ]);
  const answers = paramsToAnswers(params);
  const filtered = applyCatalogFilters(allProducts, {
    euOnly: params.eu === "1",
    minInseamCm: params.minInseam ? Number(params.minInseam) : undefined,
    minSleeveCm: params.minSleeve ? Number(params.minSleeve) : undefined,
    color: params.color || undefined,
    material: params.material || undefined,
    gender: params.gender || undefined,
  });
  const products = rankProducts(filtered, answers);
  const labels = STYLE_TAGS.filter((t) => answers.swipeTags.includes(t.id)).map((t) => t.label);

  const imageUrls = products.map((p) => p.imageUrl).filter((url): url is string => !!url);
  const dimensions = await getImageDimensionsBatch(imageUrls);
  const items: MasonryItem[] = products.map((product) => {
    const dims = product.imageUrl ? dimensions.get(product.imageUrl) : undefined;
    return { product, width: dims?.width ?? FALLBACK_RATIO.width, height: dims?.height ?? FALLBACK_RATIO.height };
  });

  return (
    <div className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-14 sm:px-8">
      <div className="mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-accent">
          {params.height ? `${params.height} / ` : ""}your feed
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {labels.length
            ? `Because you like ${labels.join(", ")}`
            : "Feed"}
        </h1>
      </div>

      {!health.isHealthy && (
        <p className="mb-8 border border-line px-5 py-3 text-sm text-muted">
          We&apos;re still growing our catalog — {health.productsWithPhotos} of{" "}
          {health.totalProducts} items have photos so far. More arriving regularly.
        </p>
      )}

      <CatalogFilterBar
        preserveParams={{
          styles: params.styles,
          occasions: params.occasions,
          proportion: params.proportion,
          fit: params.fit,
          budget: params.budget,
          height: params.height,
        }}
        euOnly={params.eu === "1"}
        minInseam={params.minInseam}
        minSleeve={params.minSleeve}
        colors={distinctColors(allProducts)}
        selectedColor={params.color}
        materials={distinctMaterials(allProducts)}
        selectedMaterial={params.material}
        selectedGender={params.gender}
      />

      <MasonryFeed items={items} placement="feed" />
    </div>
  );
}
