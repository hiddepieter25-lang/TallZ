import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Auth-aware client for use in Server Components, Server Actions, and
// Route Handlers. Must be created fresh per request (never shared/cached).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render, where cookies can't be
            // set — middleware.ts handles refreshing the session instead.
          }
        },
      },
    }
  );
}
