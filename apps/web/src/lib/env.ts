/**
 * Fail fast, and fail with a sentence you can act on.
 *
 * Without this, a missing variable surfaces as `undefined` deep inside a
 * Supabase call — usually as an opaque fetch error at request time, on a page
 * that looks broken for no visible reason. Reading them through here turns
 * that into one clear message at startup.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Add it to apps/web/.env.local and restart the dev server — Next.js only reads env files at boot.`
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ),
} as const;

/**
 * Server-only. Deliberately not part of `env` above: that object is imported
 * by client components, and anything reachable from there can end up in the
 * browser bundle. This must only ever be called from server code.
 */
export function adminPasswordEnv(): string {
  return required("ADMIN_DASHBOARD_PASSWORD", process.env.ADMIN_DASHBOARD_PASSWORD);
}
