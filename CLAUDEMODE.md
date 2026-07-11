# CLAUDE.md

Project scope for a shopping platform for tall people. Read this before making any product, design, or technical decision.

**Tradeoff:** This scope favors a strong, focused identity (Zara aesthetic, tall-people niche, discovery-first) over generic marketplace features. When in doubt, cut scope rather than add it.

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

## 3. Aesthetic: Zara, Not a Comparison Site

**If it looks like a spreadsheet with photos, it's wrong.**

- Minimal, high-end, lots of whitespace, strong product photography.
- No "corporate" or "clinical" UI patterns.
- Should feel like a fashion/lifestyle brand a user wants to open, not a tool they're forced to use.

## 4. Core Feature: Discovery Over Search

**Search is not the primary flow. Feed-based inspiration is.**

- Build a discovery page that works like a social feed: an algorithm surfaces products/content based on the user's taste.
- Users should feel inspired, not forced to type queries.
- Think: shopping platform × social media, not shopping platform + search bar.

The test: if a user's main way of finding something is typing into a search box, the core feature is broken.

## 5. Non-Goals

**Don't build these unless explicitly asked:**

- No in-house clothing brand or manufacturing.
- No search-first UX as the primary path — it's a fallback, not the flow.
- No generic "everything for everyone" marketplace — stay scoped to tall-fit clothing.

## 6. Open Decisions — Ask, Don't Assume

**These are unresolved. Flag them before building anything that depends on them:**

- Tech stack: web, mobile, or both.
- Product data sourcing: affiliate feeds, official APIs, scraping, or manual curation.
- Recommendation algorithm: content-based, collaborative filtering, or hybrid — and what data is actually available to power it.
- Monetization: affiliate commissions, ads, subscription, or a mix.
- Definition of "tall people" scope: clothing length only, or also shoe size, fit metadata, etc.

## 7. How to Work With Me

- State your assumptions before implementing. If something in this doc is ambiguous, ask — don't guess.
- Prioritize the Zara aesthetic and the discovery feed over standard e-commerce UX conventions.
- Don't add scope beyond what's written here without checking first.

---

**This scope is working if:** every feature you build traces back to "helps tall people discover clothes that fit" — and nothing gets added because it's a common e-commerce pattern rather than because this project needs it.
