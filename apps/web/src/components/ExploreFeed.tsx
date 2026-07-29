"use client";

import Image from "next/image";
import { currencySymbol, type Product } from "@/lib/products";
import { ProductSwatch } from "@/components/ProductSwatch";
import { buttonClasses } from "@/components/Button";
import { trackProductEvent } from "@/lib/track";
import { useImpressionTracking } from "@/lib/useImpressionTracking";
import { useRef, useState } from "react";

function ExploreCard({ product }: { product: Product }) {
  const [decision, setDecision] = useState<"liked" | "skipped" | null>(null);
  const cardRef = useRef<HTMLElement>(null);
  useImpressionTracking(cardRef, product.id, product.retailerId, "explore");

  const decide = (kind: "liked" | "skipped") => {
    setDecision(kind);
    trackProductEvent({
      productId: product.id,
      retailerId: product.retailerId,
      signalType: kind === "liked" ? "save" : "ignore",
      placement: "explore",
    });
  };

  return (
    <section
      ref={cardRef}
      className="flex h-[calc(100dvh-77px)] w-full shrink-0 snap-start snap-always items-center justify-center bg-line/50 py-4"
    >
      <div className="relative aspect-[9/16] h-full max-h-full max-w-full overflow-hidden bg-black">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 640px) 480px, 100vw"
            className="object-cover"
            priority
          />
        ) : (
          <ProductSwatch id={product.id} category={product.category} className="absolute inset-0 h-full w-full" />
        )}

        {/* Solid block, not a gradient — legibility without a soft fade. */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-black/85 p-5 pb-20 text-white sm:pb-5">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-white/70">
              {product.retailer}
            </p>
            <h2 className="mt-1 text-lg font-medium leading-snug">{product.name}</h2>
            {product.productUrl && (
              <p className="mt-1 font-mono text-sm">
                {currencySymbol(product.currency)}
                {product.price}
              </p>
            )}
            {product.productUrl && (
              <a
                href={product.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                onPointerDown={() =>
                  trackProductEvent({
                    productId: product.id,
                    retailerId: product.retailerId,
                    signalType: "click",
                    placement: "explore",
                    linkUrl: product.productUrl!,
                  })
                }
                className={`${buttonClasses.primary} mt-4`}
              >
                Shop this
              </a>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-center gap-3">
            <button
              aria-label="Skip"
              onClick={() => decide("skipped")}
              className={`flex h-11 w-11 items-center justify-center rounded-full border font-mono text-lg transition-colors duration-150 ease-out ${
                decision === "skipped" ? "border-card bg-card text-black" : "border-white/40 text-white hover:border-white"
              }`}
            >
              ✕
            </button>
            <button
              aria-label="Like"
              onClick={() => decide("liked")}
              className={`flex h-11 w-11 items-center justify-center rounded-full border font-mono text-lg transition-colors duration-150 ease-out ${
                decision === "liked" ? "border-accent bg-accent text-white" : "border-white/40 text-white hover:border-white"
              }`}
            >
              ♥
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ExploreFeed({ products }: { products: Product[] }) {
  return (
    <div className="h-[calc(100dvh-77px)] w-full snap-y snap-mandatory overflow-y-scroll">
      {products.map((product) => (
        <ExploreCard key={product.id} product={product} />
      ))}
    </div>
  );
}
