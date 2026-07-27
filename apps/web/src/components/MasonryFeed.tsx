"use client";

import Image from "next/image";
import { useState } from "react";
import { currencySymbol, type Product } from "@/lib/products";
import { ProductSwatch } from "@/components/ProductSwatch";
import { trackProductEvent, type Placement } from "@/lib/track";

export interface MasonryItem {
  product: Product;
  width: number;
  height: number;
}

function MasonryCard({ item, placement }: { item: MasonryItem; placement: Placement }) {
  const { product, width, height } = item;
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved((s) => !s);
    trackProductEvent({
      productId: product.id,
      retailerId: product.retailerId,
      signalType: saved ? "ignore" : "save",
      placement,
    });
  };

  const card = (
    <div className="mb-6 break-inside-avoid bg-white">
      <div className="group relative overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={width}
            height={height}
            sizes="(min-width: 1536px) 20vw, (min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={`h-auto w-full transition-[filter,opacity] duration-150 ease-out group-hover:contrast-110 ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded(true)}
          />
        ) : (
          <div style={{ aspectRatio: `${width} / ${height}` }}>
            <ProductSwatch id={product.id} category={product.category} className="h-full w-full" />
          </div>
        )}
        <button
          aria-label={saved ? "Unsave" : "Save"}
          onClick={toggleSave}
          className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center border font-mono text-sm transition-colors duration-150 ease-out ${
            saved ? "border-orange bg-orange text-white" : "border-foreground bg-background text-foreground hover:bg-foreground hover:text-background"
          }`}
        >
          ♥
        </button>
      </div>
      <div className="p-3">
        <p className="truncate font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
          {product.retailer}
        </p>
        <p className="mt-0.5 truncate text-base">{product.name}</p>
        <p className="mt-1 font-mono text-sm">
          {currencySymbol(product.currency)}
          {product.price}
        </p>
      </div>
    </div>
  );

  if (!product.productUrl) return card;

  return (
    <a
      href={product.productUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
      onPointerDown={() =>
        trackProductEvent({
          productId: product.id,
          retailerId: product.retailerId,
          signalType: "click",
          placement,
          linkUrl: product.productUrl!,
        })
      }
    >
      {card}
    </a>
  );
}

/**
 * CSS multi-column masonry — not a JS-measured grid. Each image already
 * knows its real width/height (probed server-side, see lib/image-dimensions.ts),
 * so the browser reserves the right amount of space before the image loads:
 * no layout shift, no cropping, no forcing every tile to the same size.
 */
export function MasonryFeed({
  items,
  placement = "explore",
}: {
  items: MasonryItem[];
  placement?: Placement;
}) {
  return (
    <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5">
      {items.map((item) => (
        <MasonryCard key={item.product.id} item={item} placement={placement} />
      ))}
    </div>
  );
}
