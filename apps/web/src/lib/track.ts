import { createClient } from "@/lib/supabase/browser";
import { hasAnalyticsConsent } from "@/lib/consent";

export type Placement = "feed" | "explore" | "product_card";
export type SignalType = "click" | "save" | "ignore";

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
