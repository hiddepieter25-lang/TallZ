import { defineConfig } from "vitest/config";

/**
 * Tests for the ingestion and discovery scripts in `scripts/`.
 *
 * Separate from apps/mobile's suite because these are plain .mjs Node scripts
 * with no bundler, no aliases and no React — they share nothing with the app's
 * setup beyond the runner itself. `npm test` at the root runs both.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["scripts/**/*.test.mjs"],
  },
});
