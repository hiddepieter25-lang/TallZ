"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getConsent, setConsent } from "@/lib/consent";

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(true);

  useEffect(() => {
    // Reads localStorage post-hydration to avoid an SSR/client mismatch —
    // the server can't know consent state, so it always renders hidden.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(getConsent() === null);
  }, []);

  if (!visible) return null;

  const choose = (state: "all" | "essential") => {
    setConsent(state);
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-foreground bg-background px-6 py-5 sm:px-10">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-xs leading-relaxed text-muted">
          We use your quiz answers (including height) to personalize your feed, and — only if you
          allow it — log which products you view, how long, and which you click, save, or skip
          so we can improve recommendations.
          See our{" "}
          <Link href="/privacy" className="text-foreground underline">
            Privacy Policy
          </Link>
          .
        </p>

        {customizing ? (
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.08em]">
              <input
                type="checkbox"
                checked={analyticsOn}
                onChange={(e) => setAnalyticsOn(e.target.checked)}
              />
              Analytics (view &amp; click tracking)
            </label>
            <button
              onClick={() => choose(analyticsOn ? "all" : "essential")}
              className="h-10 border border-foreground bg-foreground px-5 font-mono text-xs uppercase tracking-[0.1em] text-background transition-colors duration-150 ease-out hover:bg-background hover:text-foreground"
            >
              Save preferences
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-3 font-mono text-xs uppercase tracking-[0.1em]">
            <button onClick={() => setCustomizing(true)} className="text-muted hover:text-accent">
              Customize
            </button>
            <button
              onClick={() => choose("essential")}
              className="h-10 border border-foreground px-5 transition-colors duration-150 ease-out hover:bg-foreground hover:text-background"
            >
              Essential only
            </button>
            <button
              onClick={() => choose("all")}
              className="h-10 border border-accent bg-accent px-5 text-white transition-colors duration-150 ease-out hover:bg-background hover:text-accent"
            >
              Accept all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
