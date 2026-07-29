"use client";

import { useState } from "react";
import Image from "next/image";
import type { Product, StyleTag } from "@/lib/products";
import { ProductSwatch } from "@/components/ProductSwatch";
import { trackProductEvent } from "@/lib/track";

/**
 * A like/skip card deck over real catalog products (not stock photos) —
 * this is the "style taste" step of onboarding. Swiping/tapping through
 * real inventory is both more engaging than a checkbox list and a richer
 * taste signal, since it's tied to actual products, not just abstract tags.
 */
export function SwipeDeck({
  products,
  onComplete,
}: {
  products: Product[];
  onComplete: (likedTags: StyleTag[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [likedCount, setLikedCount] = useState(0);
  const [likedTags, setLikedTags] = useState<StyleTag[]>([]);

  if (products.length === 0) {
    return <p className="text-sm text-muted">No products to show yet.</p>;
  }

  const current = products[index];
  const done = index >= products.length;

  const decide = (liked: boolean) => {
    const nextTags = liked ? [...likedTags, ...current.tags] : likedTags;
    if (liked) {
      setLikedTags(nextTags);
      setLikedCount((c) => c + 1);
    }
    trackProductEvent({
      productId: current.id,
      retailerId: current.retailerId,
      signalType: liked ? "save" : "ignore",
      placement: "onboarding_swipe",
    });
    const nextIndex = index + 1;
    setIndex(nextIndex);
    if (nextIndex >= products.length) {
      onComplete(nextTags);
    }
  };

  if (done) {
    return (
      <div className="border border-line px-6 py-16 text-center">
        <p className="text-sm font-medium">
          {likedCount > 0
            ? `Got it — you liked ${likedCount} of ${products.length}.`
            : "No worries, we'll use your other answers."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.12em] text-accent">
        {index + 1} / {products.length}
      </p>
      <div className="relative aspect-[3/4] overflow-hidden border border-line">
        {current.imageUrl ? (
          <Image
            src={current.imageUrl}
            alt={current.name}
            fill
            sizes="400px"
            className="object-cover"
          />
        ) : (
          <ProductSwatch id={current.id} category={current.category} className="absolute inset-0" />
        )}
      </div>
      <div className="mt-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">{current.retailer}</p>
        <h3 className="text-sm font-medium">{current.name}</h3>
      </div>
      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={() => decide(false)}
          aria-label="Skip"
          className="flex h-14 w-14 items-center justify-center border border-foreground font-mono text-xl transition-colors duration-150 ease-out hover:bg-foreground hover:text-background"
        >
          ✕
        </button>
        <button
          onClick={() => decide(true)}
          aria-label="Like"
          className="flex h-14 w-14 items-center justify-center border border-accent bg-accent font-mono text-xl text-white transition-colors duration-150 ease-out hover:bg-background hover:text-accent"
        >
          ♥
        </button>
      </div>
    </div>
  );
}
