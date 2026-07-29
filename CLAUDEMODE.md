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

- The homepage leads with a large, unmissable search — filterable by inseam, sleeve, and torso length before anything else. See `apps/mobile/DESIGN.md`.
- `/explore` and `/feed` (the swipe-onboarded personalized feed) still exist and are real, working discovery surfaces — they just aren't the homepage's main act anymore.
- This reverses the earlier "discovery over search" direction from a previous iteration of this doc. Founder call, 2026-07-27: switch back to search-first.

## 5. Non-Goals

**Don't build these unless explicitly asked:**

- No in-house clothing brand or manufacturing.
- No search-first UX as the primary path — it's a fallback, not the flow.
- No generic "everything for everyone" marketplace — stay scoped to tall-fit clothing.

## 6. Open Decisions — Ask, Don't Assume

Research backing all of the below is in `MARKET_RESEARCH.md`. Items marked **RESOLVED** were explicit founder calls; items marked **PROPOSED** are the research-recommended default already reflected in the code, but haven't had an explicit sign-off — flag before assuming they're locked in for a real launch.

- **Tech stack — RESOLVED.** Web first (`apps/web`). Mobile (`apps/mobile`) not started.
- **Definition of "tall people" scope — RESOLVED.** Full industry-standard tall market, not just 190cm+: ~183cm+ (6'0") men, ~173cm+ (5'8") women. Clothing length only for v1 — no shoe size or other fit metadata. See `MARKET_RESEARCH.md` intro + §2.1.
- **Product data sourcing — PROPOSED.** Affiliate network feeds (CJ Affiliate, Rakuten Advertising, Awin) as primary, Shopify Storefront API for DTC brands not on a network, manual curation to fill gaps, scraping only as a last-resort fallback with per-retailer legal review. See `MARKET_RESEARCH.md` §4.3. **Blocked on affiliate program applications**, which need real business/tax/bank details only the founder can provide — not something that can be done from within Claude Code.
- **Recommendation algorithm — PROPOSED.** Content-based, seeded by onboarding style-tag answers (already implemented in `apps/web`'s discovery feed). Collaborative filtering deferred until there's a real user base to generate interaction data.
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
