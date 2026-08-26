import { supabase } from "@/lib/supabase";
import { hasAnalyticsConsent } from "@/lib/consent";

export type Placement = "feed" | "explore" | "product_card" | "onboarding_swipe";
export type SignalType = "click" | "save" | "ignore" | "impression";

/**
 * Fire-and-forget — never blocks or breaks the UI action it's attached to.
 * Writes to the same `product_events` table the web app used, so the admin
 * analytics and the ranking signal keep working unchanged.
 *
 * Async consent check (AsyncStorage) means this can't be a plain sync call
 * like it was on web; callers should not await it.
 */
export async function trackProductEvent(params: {
  productId: string;
  retailerId: string;
  signalType: SignalType;
  placement: Placement;
  linkUrl?: string;
  dwellMs?: number;
}): Promise<void> {
  try {
    if (!(await hasAnalyticsConsent())) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("product_events").insert({
      user_id: user?.id ?? null,
      product_id: params.productId,
      retailer_id: params.retailerId,
      signal_type: params.signalType,
      placement: params.placement,
      link_url: params.linkUrl ?? null,
      dwell_ms: params.dwellMs ?? null,
    });
    if (error) console.error("Failed to log product event:", error.message);
  } catch (err) {
    // Tracking must never take the app down with it.
    console.error("Tracking failed:", err);
  }
}

export function trackProductClick(params: {
  productId: string;
  retailerId: string;
  linkUrl: string;
  placement: Placement;
}): void {
  void trackProductEvent({ ...params, signalType: "click" });
}
