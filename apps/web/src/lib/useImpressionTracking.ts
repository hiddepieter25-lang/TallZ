"use client";

import { useEffect, useRef } from "react";
import { queueImpression, type Placement } from "@/lib/track";

const VISIBILITY_THRESHOLD = 0.5; // card counts as "seen" once at least half visible
const MIN_DWELL_MS = 300; // ignore fast scroll-past — not a real "view"

/** Tracks how long a product card stays visible and queues a batched impression event when it stops being visible (or on unmount, so navigating away doesn't lose that dwell time). */
export function useImpressionTracking(
  ref: React.RefObject<Element | null>,
  productId: string,
  retailerId: string,
  placement: Placement
) {
  const visibleSinceRef = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const flush = () => {
      if (visibleSinceRef.current === null) return;
      const dwellMs = performance.now() - visibleSinceRef.current;
      visibleSinceRef.current = null;
      if (dwellMs >= MIN_DWELL_MS) {
        queueImpression({ productId, retailerId, placement, dwellMs: Math.round(dwellMs) });
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          visibleSinceRef.current = performance.now();
        } else {
          flush();
        }
      },
      { threshold: VISIBILITY_THRESHOLD }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      flush();
    };
  }, [ref, productId, retailerId, placement]);
}
