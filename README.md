# TALLZ

A discovery-first marketplace aggregating clothing from external retailers for tall people. See [CLAUDEMODE.md](./CLAUDEMODE.md) for product scope and [CLAUDE.md](./CLAUDE.md) for working guidelines.

## Structure

npm workspaces monorepo:

- `apps/mobile` — **the product.** Expo SDK 57 + expo-router + React Native (TypeScript).
- `apps/web` — Next.js. The **admin panel** (catalog, retailers, analytics, algorithm), plus `/privacy`, which both app stores require at a public URL. Everything else was deleted: the public storefront on 2026-08-28, and the auth pages later the same day once the app could receive Supabase's emails itself. `/` redirects to `/admin` and the whole thing is `noindex`.
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

> **`Unable to resolve module <something>` after an `npm install`?**
>
> Metro caches where every module lives. Installing or removing a package while
> the dev server is running replaces files underneath it, and the cache still
> points at the old layout — so it reports a module as missing that is sitting
> right there on disk. It is not a broken dependency and adding the package by
> hand will not help.
>
> ```bash
> npm run start:clear --workspace=apps/mobile
> ```
>
> Hit this on 2026-08-28 with `nanoid/non-secure` after adding vitest. Node
> resolved the module fine the whole time; only Metro's cache disagreed.

**Web (admin):**

```bash
npm run dev --workspace=apps/web
```

## Open decisions

Product data sourcing, the recommendation algorithm beyond the current heuristic, and monetization details are unresolved — see [CLAUDEMODE.md](./CLAUDEMODE.md#6-open-decisions--ask-dont-assume) before building features that depend on them. The brand name and logo are also still open.
