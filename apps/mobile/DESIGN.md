# DESIGN.md — TallZ

Design rules for the TallZ website. Follow these unless told otherwise.

**What TallZ is:** an aesthetic closet you carry on your phone — affordable tall-fit clothing, presented like a fashion drop, one tap from checkout on the seller's own site. "Cheap fashion in a high-fashion jacket": the pieces are accessible, the presentation isn't. Feed-native, algorithm-driven, built to be pleasant to scroll, not a spreadsheet with photos.

This supersedes the earlier "Swiss design poster" direction (hard corners, mono labels everywhere, cold black/white/orange) — that system is retired. Founder call: it read as expensive/boutique rather than "affordable fashion, elevated." Rounded, warm, and app-like is now the rule, not the exception.

---

## Colors

```css
--background: #F5EDE7; /* --paper — warm blush-white, NOT stark white */
--foreground: #1A1613; /* --ink — text, fills */
--card:       #FBF7F3; /* photo backdrops, panels sitting on paper — barely lighter than paper, never pure white */
--muted:      #8B7F74; /* meta text, secondary copy */
--line:       #1A16131A; /* hairline borders, ~10% ink */
--accent:     #3348FF; /* the one accent — electric cobalt, replaces the old orange */
```

Rules:

- One accent only, still. It changed from orange to cobalt — don't reintroduce orange, don't add a second accent alongside cobalt.
- `--card` exists specifically so product photography and panels never sit on pure white — everything warm, nothing stark.

## Typography

One family, two weights doing different jobs — the old mono-for-labels convention is gone.

```css
--font-display: "Archivo", "Helvetica Neue", Arial, sans-serif; /* everything: headings, body, labels, prices */
```

Sizes:

| Use | Size | Weight | Notes |
|---|---|---|---|
| Hero / oversized wordmark | `clamp(40px, 9vw, 96px)` | 800–900 | Tight — `letter-spacing: -0.02em`, often uppercase, frequently overlapping a photo |
| H1 | 40px | 700 | |
| H2 | 24–28px | 700 | |
| Body | 16px | 400 | `line-height: 1.6`, max 65 characters wide |
| Label / meta | 10–11px | 600–700 | UPPERCASE, `letter-spacing: 0.06–0.1em` — same family as headings, not a mono face |
| Price | 13–20px | 700 | Same sans, never monospace |

Rules:

- The oversized wordmark moment (hero headline over a photo) is the one place to be genuinely loud — Off-White/travel-site energy. Everywhere else stays calm.
- Labels/meta are still uppercase and tracked, but they're a heavier weight of the same sans now, not a separate mono typeface — the app should feel like one voice, not a poster plus a spec sheet.
- Body copy is plain sentence case.

## Layout

Mobile-first. The product is a phone-native scrollable feed first, a responsive website second — design the feed, then adapt it up to desktop width (a centered, moderately narrow column or a grid), not the other way around.

Rules:

- Chips, cards, and rails scroll horizontally where that reads as natural (category filters, quick collections) — an app pattern, not a poster pattern.
- Generous gaps over generous margins — spacing comes from `gap` in flex/grid feeds, not from a strict 12-column poster grid.
- One "hero card" moment per screen/section is allowed to be bold (oversized type over a photo); everything around it stays quiet.
- Thin hairline rules still separate sections — kept from the old system, still useful, still restrained.

## Homepage Structure

Fixed section order — implemented in `apps/web/src/app/page.tsx`:

1. **Hero** — two-column on desktop, stacked on mobile: headline + lede + search on one side, an "algorithm pick" style photo card (bold type overlapping the image) on the other.
2. **Search** — the primary search input plus a horizontally-scrollable row of rounded filter chips (inseam, sleeve, torso, "under €30"). See Search below.
3. **Statement** — a single blunt line about the fit problem, on a warm/ink band. Still one full-bleed block maximum per page.
4. **Product grid** — "New in [category]", real products pulled from the catalog, rounded cards with a save-heart and a fit badge, same `ProductCard` used on `/explore` and `/feed`.
5. **Quiz CTA** — secondary, links to onboarding for the personalized feed. Still the fallback path, not the lead.

## Components

**Buttons** — rounded pill (`border-radius: 9999px`). Primary is solid cobalt with warm-white text. Secondary is a 1px ink outline on transparent. Height 48px, uppercase label (regular sans, not mono), 24px horizontal padding. Hover inverts fill and text; no scale, no shadow.

**Product cards** — `--card` surface, rounded corners (`~16px`), no border. Image on top at 3:4 portrait with a rounded save-heart button overlaid top-right and a small rounded "fit" badge overlaid bottom-left (e.g. "36\" inseam", "Tall fit ✓"). Below: brand in uppercase caps 10–11px, product name 12–16px regular, price in bold sans (a struck-through "was" price next to a discounted price is encouraged — this is a shopping feed, show the deal). Hover raises image contrast slightly; nothing moves.

**Filters** — presented as rounded pill chips in a horizontally-scrollable row, active state filled cobalt. Tall-specific measurements (inseam, sleeve, height range) stay the primary filter.

**Nav** — thin, fixed, transparent over paper. Logo left, links regular sans (not mono caps), search right. A 1px rule under it. It does not shrink or animate on scroll.

**Search** — rounded input, 1px ink border, regular-sans placeholder. Still the core entry point; on the homepage it stays large and unmissable.

## Motion

Restrained, but a little more alive than the old system.

- Transitions: `150–250ms ease-out` for hover/state changes.
- A single orchestrated entrance (hero fade/rise on load) is allowed — one moment, not scattered effects.
- Not allowed: bounce, spring, parallax, scroll-jacking, animated gradients, decorative loops.
- Respect `prefers-reduced-motion` — disable the entrance animation for users who ask for it.

## Imagery

- Warm, color-graded product and lifestyle photography — not stark high-contrast black-and-white. The old "editorial b&w" direction is retired along with the poster system.
- Prefer full-body/full-garment shots that show the tall fit, but the mood is "aspirational drop," not "art-book."
- No stock-photo smiling, no flat white-background e-commerce cutouts — but also nothing cold or gallery-like. Think fashion-app lookbook, not museum wall.

## Voice

Confident and a little playful — not flat/deadpan anymore, but still specific, never salesy.

- Good: "36\" inseam. €34 — was €52."
- Still bad: "Finally! Jeans that fit YOU! 🎉"

Still no emoji in UI copy, still no exclamation marks. Numbers and measurements are shown as numbers.

## Naming & logo

Open question, not yet resolved — the founder is considering a new name/logo but hasn't decided. Keep using "TallZ" everywhere until a real decision is made and documented here; don't quietly introduce a new name in only some places.

---

## Don't

- Stark high-contrast black-and-white editorial photography as the primary mood
- Orange as an accent, or a second accent color alongside cobalt
- A separate mono/monospace typeface for labels — one family only
- Pure white `#FFFFFF` as a background or card surface
- Centered layouts or centered body text
- Animation that draws attention to itself beyond the one hero entrance
