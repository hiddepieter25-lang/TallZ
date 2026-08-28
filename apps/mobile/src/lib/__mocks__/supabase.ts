/**
 * Stand-in for `@/lib/supabase` under vitest — see the alias in
 * `vitest.config.ts` for why.
 *
 * Deliberately not a working fake. Every function these tests cover is pure, so
 * nothing should ever reach this object; if something does, the thrown error
 * says so plainly instead of the test quietly passing against a stub that
 * returned empty data.
 */
export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      throw new Error(
        `The Supabase client was used in a test (.${String(prop)}). These tests ` +
          `cover pure functions only — if you meant to test a query, give it a real ` +
          `fake or an integration test rather than extending this stub.`
      );
    },
  }
);
