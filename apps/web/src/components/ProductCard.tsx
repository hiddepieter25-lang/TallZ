"use client";

import Image from "next/image";
import { currencySymbol, type Product } from "@/lib/products";
import { ProductSwatch } from "@/components/ProductSwatch";
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
    <article className="group bg-white">
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
      </div>
      <div className="mt-3 space-y-1 px-0.5">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
          {product.retailer}
        </p>
        <h3 className="text-base leading-snug">{product.name}</h3>
        {fit && (
          <span className="inline-block bg-orange px-1.5 py-0.5 font-mono text-[10px] font-medium text-white">
            {fit}
          </span>
        )}
        <p className="font-mono text-sm">
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
