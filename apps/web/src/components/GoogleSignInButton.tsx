"use client";

import { createClient } from "@/lib/supabase/browser";

export function GoogleSignInButton({ next, dark = false }: { next?: string; dark?: boolean }) {
  const signIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`,
      },
    });
  };

  return (
    <button
      type="button"
      onClick={signIn}
      className={
        dark
          ? "flex h-12 w-full items-center justify-center gap-2 border border-background/30 bg-transparent font-mono text-xs uppercase tracking-[0.1em] text-background transition-colors duration-150 ease-out hover:border-background"
          : "flex h-12 w-full items-center justify-center gap-2 border border-foreground bg-transparent font-mono text-xs uppercase tracking-[0.1em] transition-colors duration-150 ease-out hover:border-orange hover:text-orange"
      }
    >
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.88-3c-1.08.73-2.46 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.1A12 12 0 0 0 12 24Z" />
        <path fill="#FBBC05" d="M5.29 14.3a7.2 7.2 0 0 1 0-4.6v-3.1H1.28a12 12 0 0 0 0 10.8l4.01-3.1Z" />
        <path fill="#EA4335" d="M12 4.75c1.76 0 3.35.6 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.28 6.6l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75Z" />
      </svg>
      Continue with Google
    </button>
  );
}
