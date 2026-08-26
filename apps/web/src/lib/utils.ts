/**
 * Small shared helpers. Deliberately thin — most "utils" grow into a junk
 * drawer, so anything with a real domain meaning belongs in
 * `server/queries/products.ts` instead.
 */

/** Joins class names, dropping falsy ones — the usual conditional-class shape. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** e.g. "2026-08-26T…" -> "26 Aug 2026". Locale-fixed so server and client agree. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
