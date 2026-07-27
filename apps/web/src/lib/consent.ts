const KEY = "tallz-consent";

export type ConsentState = "all" | "essential";

export function getConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  return v === "all" || v === "essential" ? v : null;
}

export function setConsent(state: ConsentState) {
  window.localStorage.setItem(KEY, state);
}

/** Outbound links always work regardless of consent — this only gates whether we log the click for analytics. */
export function hasAnalyticsConsent(): boolean {
  return getConsent() === "all";
}
