import { createBrowserClient } from "@supabase/ssr";

// Auth-aware client for use in Client Components (login/signup/reset,
// account pages). Cookie handling is automatic. Distinct from the plain
// anon client in `@/lib/supabase`, which stays as-is for anonymous
// public-catalog reads (products/retailers need no session).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
