# TALLZ

A discovery-first marketplace aggregating clothing from external retailers for tall people. See [CLAUDEMODE.md](./CLAUDEMODE.md) for product scope and [CLAUDE.md](./CLAUDE.md) for working guidelines.

## Structure

npm workspaces monorepo:

- `apps/mobile` — **the product.** Expo SDK 57 + expo-router + React Native (TypeScript).
- `apps/web` — Next.js. The **admin panel** (catalog, retailers, analytics, algorithm), plus three things that have to stay reachable on the open web: `/privacy` (both app stores require a public privacy-policy URL), and `/auth/callback` + `/reset-password` (where Supabase's signup-confirmation and password-reset emails land, because the app can't receive an https link yet). The public storefront pages were deleted 2026-08-28 — the app is the storefront now. `/` redirects to `/admin`.
- `scripts/` — the retailer ingestion jobs, run on a schedule by GitHub Actions.

Both apps talk to the same Supabase project and the same RLS policies. Design rules live in [apps/mobile/DESIGN.md](./apps/mobile/DESIGN.md); the tokens are implemented in `apps/mobile/src/lib/theme.ts`.

## Getting started

```bash
npm install
```

**Mobile (the app):**

```bash
npm run start --workspace=apps/mobile
```

Then scan the QR code with **Expo Go** on a phone. `npx expo start --web` renders it in a browser via react-native-web, which is useful for a quick look but is *not* a substitute for a real device — safe areas, tap targets and the in-app browser only behave correctly on hardware.

Needs `apps/mobile/.env.local` with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Expo only reads env vars at startup, so restart the dev server after changing them.

**Web (admin):**

```bash
npm run dev --workspace=apps/web
```

## Open decisions

Product data sourcing, the recommendation algorithm beyond the current heuristic, and monetization details are unresolved — see [CLAUDEMODE.md](./CLAUDEMODE.md#6-open-decisions--ask-dont-assume) before building features that depend on them. The brand name and logo are also still open.
