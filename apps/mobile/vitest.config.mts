import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// .mts, not .ts: without it Vite loads this as CommonJS and warns that the ESM
// syntax here will break when its native config loader becomes the default.

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      // `products.ts` imports the Supabase client at module scope, and that
      // module pulls in react-native, expo-secure-store and AsyncStorage, then
      // throws unless the Expo env vars are set. None of that can load in plain
      // Node, so the import would fail before a single test ran.
      //
      // The functions under test are pure and never touch the client, so it is
      // swapped for a stub here rather than restructuring production code to
      // suit the test runner. If a query function ever needs testing, that is
      // the moment to split products.ts — not before.
      { find: /^@\/lib\/supabase$/, replacement: `${src}/lib/__mocks__/supabase.ts` },
      { find: /^@\//, replacement: `${src}/` },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
