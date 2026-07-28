import { createClient } from "@/lib/supabase/browser";
import { hasAnalyticsConsent } from "@/lib/consent";

export type Placement = "feed" | "explore" | "product_card" | "onboarding_swipe";
export type SignalType = "click" | "save" | "ignore" | "impression";

/** Fire-and-forget — never blocks or breaks whatever UI action it's attached to. */
export function trackProductEvent(params: {
  productId: string;
  retailerId: string;
  signalType: SignalType;
  placement: Placement;
  linkUrl?: string;
}) {
  if (!hasAnalyticsConsent()) return;

  const supabase = createClient();
  supabase.auth.getUser().then(({ data: { user } }) => {
    supabase
      .from("product_events")
      .insert({
        user_id: user?.id ?? null,
        product_id: params.productId,
        retailer_id: params.retailerId,
        signal_type: params.signalType,
        placement: params.placement,
        link_url: params.linkUrl ?? null,
      })
      .then(({ error }) => {
        if (error) console.error("Failed to log product event:", error.message);
      });
  });
}

export function trackProductClick(params: {
  productId: string;
  retailerId: string;
  linkUrl: string;
  placement: Placement;
}) {
  trackProductEvent({ ...params, signalType: "click" });
}

// --- Impressions: batched, since these fire far more often than a click/save/ignore ---

interface ImpressionRow {
  productId: string;
  retailerId: string;
  placement: Placement;
  dwellMs: number;
}

let impressionQueue: ImpressionRow[] = [];

async function flushImpressions() {
  if (impressionQueue.length === 0) return;
  const batch = impressionQueue;
  impressionQueue = [];

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("product_events").insert(
    batch.map((row) => ({
      user_id: user?.id ?? null,
      product_id: row.productId,
      retailer_id: row.retailerId,
      signal_type: "impression" as const,
      placement: row.placement,
      dwell_ms: row.dwellMs,
    }))
  );
  if (error) console.error("Failed to log impression batch:", error.message);
}

const FLUSH_INTERVAL_MS = 5000;
if (typeof window !== "undefined") {
  setInterval(flushImpressions, FLUSH_INTERVAL_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushImpressions();
  });
  window.addEventListener("pagehide", flushImpressions);
}

/** Queues an impression for batched insert — never one request per scrolled-past card. */
export function queueImpression(row: ImpressionRow) {
  if (!hasAnalyticsConsent()) return;
  impressionQueue.push(row);
}
