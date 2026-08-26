"use client";

import Image from "next/image";
import { currencySymbol, type Product } from "@/server/queries/products";
import { ProductSwatch } from "@/components/features/products/ProductSwatch";
import { trackProductClick, type Placement } from "@/lib/track";

const BOTTOMS_CATEGORIES = new Set(["Trousers", "Denim", "Cargo", "Activewear"]);

function fitLine(product: Product): string | null {
  if (BOTTOMS_CATEGORIES.has(product.category)) {
    return product.inseamCm ? `${product.inseamCm}cm inseam` : null;
  }
  const parts: string[] = [];
  if (product.sleeveCm) parts.push(`${product.sleeveCm}cm sleeve`);
  if (product.bodyLengthCm) parts.push(`${product.bodyLengthCm}cm body`);
  return parts.length ? parts.join(" · ") : null;
}

/**
 * The homepage teaser card. Intentionally has no save button — this is the
 * shop window for signed-out visitors, so it shows what the catalog looks like
 * and nothing more. Saving lives on the account-gated surfaces (`MasonryFeed`
 * on /feed and /search, `ExploreFeed` on /explore), which is where a signed-in
 * user actually builds their closet.
 */
export function ProductCard({
  product,
  priority = false,
  placement = "product_card",
}: {
  product: Product;
  /** Set for the first few above-the-fold cards so the browser loads that image immediately. */
  priority?: boolean;
  placement?: Placement;
}) {
  const fit = fitLine(product);

  const card = (
    <article className="group overflow-hidden rounded-2xl bg-card">
      <div className="relative aspect-[3/4] overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-[filter] duration-150 ease-out group-hover:contrast-110"
          />
        ) : (
          <ProductSwatch
            id={product.id}
            category={product.category}
            className="absolute inset-0 transition-[filter] duration-150 ease-out group-hover:contrast-110"
          />
        )}
        {fit && (
          <span className="absolute bottom-2 left-2 rounded-full bg-foreground/80 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.04em] text-background">
            {fit}
          </span>
        )}
      </div>
      <div className="mt-3 space-y-1 px-0.5">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
          {product.retailer}
        </p>
        <h3 className="text-base leading-snug">{product.name}</h3>
        <p className="text-sm font-bold">
          {currencySymbol(product.currency)}
          {product.price}
        </p>
      </div>
    </article>
  );

  if (!product.productUrl) return card;

  return (
    <a
      href={product.productUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
      onPointerDown={() =>
        trackProductClick({
          productId: product.id,
          retailerId: product.retailerId,
          linkUrl: product.productUrl!,
          placement,
        })
      }
    >
      {card}
    </a>
  );
}
