# TALLZ

A discovery-first marketplace aggregating clothing from external retailers for tall people. See [CLAUDEMODE.md](./CLAUDEMODE.md) for product scope and [CLAUDE.md](./CLAUDE.md) for working guidelines.

## Structure

npm workspaces monorepo:

- `apps/web` — Next.js (TypeScript, Tailwind, App Router)
- `apps/mobile` — Expo (TypeScript)

## Getting started

```bash
npm install

# web
npm run dev --workspace=apps/web

# mobile
npm run start --workspace=apps/mobile
```

## Open decisions

Product data sourcing, recommendation algorithm, monetization, and the exact definition of "tall" fit scope are unresolved — see [CLAUDEMODE.md](./CLAUDEMODE.md#6-open-decisions--ask-dont-assume) before building features that depend on them.
