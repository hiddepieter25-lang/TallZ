# CLAUDE.md

Project scope for a shopping platform for tall people. Read this before making any product, design, or technical decision.

**Tradeoff:** This scope favors a strong, focused identity ("cheap fashion in a high-fashion jacket", tall-people niche, discovery-first) over generic marketplace features. When in doubt, cut scope rather than add it.

## 1. The Problem

**Tall people can't find clothes that fit. Fit is scattered across too many brands.**

- No single brand covers the need well enough on its own.
- Suitable products exist, but spread across many retailers (Zara, ASOS, and other brands with extended sizing).
- The gap isn't supply — it's discovery.

## 2. What This Is

**A marketplace that aggregates, not a brand that manufactures.**

- No in-house clothing line. This is not on the table for v1.
- Products are sourced from external retailers/brands that carry sizes suited to tall people.
- The platform's value is curation and discovery, not manufacturing.

## 3. Aesthetic: An Aesthetic Closet on Your Phone, Not a Comparison Site

**If it looks like a spreadsheet with photos, it's wrong. If it looks like an expensive boutique, it's also wrong — the clothes are affordable, the presentation just isn't cheap.**

- Founder's own framing: "cheap fashion in a high-fashion jacket." Products stay accessible; the feed, photography, and app-like polish make them feel elevated.
- Mobile-first, feed-native — closer to a personal Pinterest/Instagram "closet" than a poster or a boutique website. See `apps/mobile/DESIGN.md`.
- No "corporate" or "clinical" UI patterns. No cold/gallery-like editorial either (that was tried and rejected — see DESIGN.md history).
- Should feel like an app a user wants to keep scrolling and shopping, not a tool they're forced to use.

## 4. Core Feature: Search First, Personalized Feed as a Secondary Path

**Search is the primary flow. The quiz-driven feed is a secondary, opt-in path for users who want a personalized view.**

- Search is filterable by inseam, sleeve, and torso length before anything else. See `apps/mobile/DESIGN.md`.
- The quiz-driven personalized feed and the explore/swipe surface remain real parts of the product — they just aren't the entry point.
- This reverses the earlier "discovery over search" direction from a previous iteration of this doc. Founder call, 2026-07-27: switch back to search-first.
- **Status after the 2026-08-26 move to an app (§6):** the app currently ships only the ranked feed — search, quiz and explore aren't built there yet. The search-first principle still stands as the target; it just hasn't been reached on the new platform. Don't read the current app as a change of direction.

## 5. Non-Goals

**Don't build these unless explicitly asked:**

- No in-house clothing brand or manufacturing.
- No generic "everything for everyone" marketplace — stay scoped to tall-fit clothing.
- No public browsing in the app — an account is required (see §6). The store listing does the shop-window job that the old public homepage did.

*(Removed 2026-08-26: a non-goal reading "No search-first UX as the primary path — it's a fallback, not the flow." It directly contradicted §4, which has said the opposite since the 2026-07-27 reversal. It was stale, not a second opinion.)*

## 5a. Known Trap: RLS policies scoped to `anon` only

**This has now bitten twice. Check it before debugging anything that returns empty.**

Several Supabase policies were originally written `to anon` rather than `to anon, authenticated`. That was invisible while the website was the only client, because its public pages read the catalog through a *session-less* client (`@/lib/supabase`) which runs as `anon`. The mobile app uses **one session-aware client for everything**, so a signed-in user runs as `authenticated` — and any policy scoped to `anon` silently returns zero rows, with no error.

Occurrences found and fixed:
- `onboarding_responses` INSERT (2026-08-26) — logged-in users' quiz answers were rejected and the failure was swallowed; 24 stored rows, none attached to a user.
- `products`, `product_images`, `retailers` SELECT (2026-08-26) — Home, Search and Explore all rendered "Nothing here yet" for every signed-in user.

**Rule going forward:** any new policy on a table the app reads or writes must list both roles, or use `public`. When something comes back empty with no error, check `pg_policies.roles` first — this failure mode never throws.

## 6. Open Decisions — Ask, Don't Assume

Research backing all of the below is in `MARKET_RESEARCH.md`. Items marked **RESOLVED** were explicit founder calls; items marked **PROPOSED** are the research-recommended default already reflected in the code, but haven't had an explicit sign-off — flag before assuming they're locked in for a real launch.

- **Tech stack — RESOLVED, reversed 2026-08-26.** **Mobile app first** (`apps/mobile`, Expo SDK 57 + expo-router + React Native). `apps/web` **has been reduced to the admin panel** — the public pages were deleted 2026-08-28. Founder call: shopping belongs in an app, and an app carries more value than a site. I had argued the opposite earlier (marketing an unknown app is harder than sharing a link); the founder reaffirmed with their own reasoning, so the decision stands and is not to be re-litigated.
  - Two constraints that came out of researching this, both worth remembering: **Windows is not a blocker** (EAS Build compiles iOS in Expo's macOS cloud; free tier is 15 iOS + 15 Android builds/month and cannot overspend — it just stops until the 1st). And **Apple review guideline 4.2.2** rejects apps that are mainly "content aggregators, or a collection of links" — a literal description of an outbound-affiliate marketplace. The exemption is the opening clause *"Other than catalogs"*, so the app must be a genuine searchable/filterable catalog, not a link list. This is why a wrapped website was never an option (and Capacitor is separately blocked: Next.js `output: 'export'` forbids Server Actions and `cookies()`).
  - **Google Play needs 12 testers opted in for 14 continuous days** before a personal account can ship to production. That is calendar time, not money — community recruitment has to start ~3 weeks before any Play launch date.
  - **What is left on the web, and why.** Two things. `/admin/*` is the panel itself — retailer approval and catalog editing happen nowhere else. `/privacy` is a store requirement: both Apple and Google need a publicly reachable privacy-policy URL for the listing.
  - **Auth moved fully into the app on 2026-08-28.** `/auth/callback` and the web `/reset-password` pages were deleted the same day they were kept, once the app could receive the links itself. `signUp` now passes `emailRedirectTo`, the app has `forgot-password` and `reset-password` screens, and `_layout.tsx` turns an incoming `tallz://` link into a session (`src/lib/deep-links.ts` parses it; PKCE code, implicit token pair, and expired-link error are all handled). The founder chose to remove the web fallback rather than keep it, after being advised otherwise — that is their call and stands.
  - **This depends on one dashboard setting.** Supabase → Authentication → URL Configuration must list `tallz://*` under Redirect URLs. Without it Supabase ignores `emailRedirectTo` and falls back to the Site URL, which is now a deleted page — signup confirmation and password reset both break, silently. Only the founder can set this; it is not exposed through any tool here.
  - **Escape hatch if a deep link misbehaves.** There is deliberately no web fallback any more, so if the link is wrong nobody can confirm an account or reset a password. Two ways out, both from the Supabase dashboard: Authentication → Users → a user's row can be confirmed by hand, and "Send recovery" generates a fresh link. Failing that, the web pages are one command away in git: `git revert` the commit that deleted them. Worth knowing before there are real users; right now there are none, which is why this was the cheap moment to make the change.
  - `/` redirects to `/admin`, and the root layout sets `robots: noindex` — nothing left here is meant to be found by search.
- **Definition of "tall people" scope — RESOLVED.** Full industry-standard tall market, not just 190cm+: ~183cm+ (6'0") men, ~173cm+ (5'8") women. Clothing length only for v1 — no shoe size or other fit metadata. See `MARKET_RESEARCH.md` intro + §2.1.
- **Product data sourcing — PROPOSED.** Affiliate network feeds (CJ Affiliate, Rakuten Advertising, Awin) as primary, Shopify Storefront API for DTC brands not on a network, manual curation to fill gaps, scraping only as a last-resort fallback with per-retailer legal review. See `MARKET_RESEARCH.md` §4.3. **Blocked on affiliate program applications**, which need real business/tax/bank details only the founder can provide — not something that can be done from within Claude Code.
  - **robots.txt is checked before any product feed is read** (`scripts/lib/robots.mjs`, RFC 9309). Discovery asks before fetching a candidate's catalog; the weekly sync re-asks every run, so a retailer that adds a Disallow later stops being pulled without anyone noticing manually. A refusal is recorded as `skipped`, not as a failure. Audited all 19 existing retailers on 2026-08-31: every one permits it, so nothing was removed. Shopify's `/products.json` is a feed the shop publishes itself, not a scrape — but robots.txt is the clearest "no" a site can give, and TallZ is asking these same retailers for affiliate deals. Two things this does **not** settle, both flagged for real legal advice before launch: product photos are hot-linked from retailer CDNs and are copyrighted, and the EU database right may cover substantial extraction from a catalog regardless of robots.txt.
- **Recommendation algorithm — PROPOSED.** Content-based, seeded by onboarding style-tag answers (implemented in the app's ranked feed; the web discovery feed it started in was deleted 2026-08-28). Collaborative filtering deferred until there's a real user base to generate interaction data.
- **Monetization — RESOLVED.** Affiliate commission on outbound clicks first (already live in the schema, no traffic to sell ads against yet), plus paid ad placements/banners as a second revenue stream once there's real traffic. Subscription not planned.
- **Is this a real business — RESOLVED.** Yes — founder intends to launch this as a real, revenue-generating business, not a personal/learning project. No fixed deadline. Treat scope/quality decisions accordingly: build it right rather than fast.
- **Team — RESOLVED.** Solo founder working with Claude Code; no other humans on the project yet. No urgency on multi-user permissions/roles — a real login system is still needed before any "save your favorites" or admin features, per the open item below.
- **Launch geography — RESOLVED.** Europe first, then UK and USA. This is about where TALLZ launches/markets to users — the retailer sourcing itself stays global (see `MARKET_RESEARCH.md` §3).
- **Launch plan — RESOLVED.** Soft launch first (close friends + tall-size Discord/niche communities) for feedback, then a wider social-media push to grow the user base.
- **Budget — RESOLVED.** No large budget. Up to ~$100/month if genuinely necessary, but default to free options as long as possible.
- **Aesthetic — RESOLVED, see `apps/mobile/DESIGN.md`.** Treat that file as the living source of truth for colors, type, spacing, components, motion, and voice rather than re-describing it here (it changes independently of this doc and duplicating it would just drift out of sync). The Swiss-poster system (black/paper/orange, Archivo + JetBrains Mono, hard corners) was retired 2026-07-29 after the founder reviewed a mockup and found it read as expensive/boutique rather than "affordable fashion, elevated." A warm-paper/cobalt-accent direction briefly replaced it, then was itself replaced 2026-07-30: founder disliked the blue and wanted pure white, not a warm tint — current palette is pure black/white/grey, no color accent at all. Rounded shape language, single Archivo family, and mobile-first feed structure from the 07-29 pivot are unaffected — this second change was color-only. Search stays the homepage's primary flow (§4 above is unaffected).
- **Naming & logo — OPEN, not yet resolved.** The founder is considering renaming the brand and changing the logo, but hasn't decided or picked a direction. Keep using "TallZ" everywhere until this is explicitly resolved — don't introduce a new name in only some places.

## 7. How to Work With Me

- State your assumptions before implementing. If something in this doc is ambiguous, ask — don't guess.
- Prioritize the "aesthetic closet" feel and the discovery feed over standard e-commerce UX conventions.
- Don't add scope beyond what's written here without checking first.

---

**This scope is working if:** every feature you build traces back to "helps tall people discover clothes that fit" — and nothing gets added because it's a common e-commerce pattern rather than because this project needs it.
