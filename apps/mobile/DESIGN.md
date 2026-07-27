# DESIGN.md — TallZ

Design rules for the TallZ website. Follow these unless told otherwise.

**What TallZ is:** a search hub that aggregates clothing that actually fits tall people — long inseams, long sleeves, tall sizes.

**How it should feel:** a Swiss design poster, not a shopping app. High-contrast black and white, one hot orange, hard grid, big confident type, lots of empty space. Editorial fashion magazine energy. Never cute, never rounded, never soft.

---

## Colors

```css
--black:  #0A0A0A;   /* text, ink, fills */
--paper:  #F2F0EC;   /* page background — warm off-white, NOT pure white */
--white:  #FFFFFF;   /* cards, panels sitting on paper */
--rule:   #0A0A0A1A; /* hairline borders */
```

Rules:


## Typography

Two families only.

```css
--font-display: "Archivo", "Helvetica Neue", Arial, sans-serif;  /* headings, UI */
--font-mono: "JetBrains Mono", "SF Mono", monospace;             /* labels, meta, numbers */
```

Sizes:

| Use | Size | Weight | Notes |
|---|---|---|---|
| Hero | `clamp(64px, 11vw, 180px)` | 700 | Tight — `letter-spacing: -0.04em; line-height: 0.88` |
| H1 | 56px | 700 | |
| H2 | 32px | 600 | |
| Body | 16px | 400 | `line-height: 1.6`, max 65 characters wide |
| Label | 11px | 500 | mono, `letter-spacing: 0.12em`, UPPERCASE |
| Meta | 12px | 400 | mono, `--black` at 60% |

Rules:

- Headings are set enormous and tight. Let them nearly touch the container edge.
- Small mono labels in caps do the structural work — section markers, category tags, "01 / 04", coordinates, dates. They come from the poster references and should appear on every section.
- Body copy is plain sentence case. Only the mono labels are uppercase.
- Never center body text. Headings may be left-aligned or, occasionally, split across the grid.

## Layout

12-column grid, 24px gutters, max width 1440px, 32px page margins (16px on mobile).

Rules:

- Alignment to the grid is strict. Elements start and end on column lines.
- Asymmetry over symmetry — a heading in columns 1–5 with an image in 7–12 beats a centered stack.
- Whitespace is the main material. Sections get 120px+ of vertical breathing room. Do not fill empty space.
- Full-bleed orange or black blocks may break the grid horizontally for emphasis — one per page maximum.
- Thin `1px` rules separate sections. Use them like a magazine, not like a table.

## Homepage Structure

Fixed section order — implemented in `apps/web/src/app/page.tsx`:

1. **Hero** — two-column: giant headline + lede on the left (cols 1–6), image slot on the right (cols 8–12).
2. **Search** — the primary search input plus a row of tall-specific filter chips (inseam, sleeve, torso). See Search below.
3. **Statement** — the one full-bleed orange block allowed per page (see Layout rule above). A single blunt line about the sizing problem.
4. **Product grid** — "New in [category]", 4 real products pulled from the catalog, same `ProductCard` used on `/explore` and `/feed`.
5. **Quiz CTA** — secondary, links to onboarding for the personalized feed. Not full-bleed, not oversized — it's the fallback path, not the lead.

## Components

**Buttons** — square corners (`border-radius: 0`). Primary is solid orange with white text. Secondary is a 1px black outline on transparent. Height 48px, mono uppercase label, 24px horizontal padding. Hover inverts fill and text; no scale, no shadow.

**Product cards** — white on paper, no border, no shadow, no radius. Image on top at 3:4 portrait. Below: brand in mono caps 11px, product name in 16px regular, inseam or sleeve length as a small orange mono tag, price in mono. Hover raises image contrast slightly; nothing moves.

**Filters** — the tall-specific measurements (inseam, sleeve, height range) are the primary filter and sit above everything else. Presented as square mono chips, active state filled black.

**Nav** — thin, fixed, transparent over paper. Logo left, links in mono caps, search right. A 1px rule under it. It does not shrink or animate on scroll.

**Search** — square input, 1px black border, mono placeholder. This is the core of the product; on the homepage it is large and unmissable.

## Motion

Restrained to the point of severity.

- Transitions: `150ms ease-out`. Nothing longer than 250ms.
- Allowed: opacity fades, color changes, 1px border changes.
- Not allowed: bounce, spring, parallax, scroll-jacking, animated gradients, floating elements, decorative loops.
- One exception: a hero image may sit still while type scrolls past it.

## Imagery

- Prefer full-body shots showing the whole silhouette — the length of the garment is the product.
- High-contrast black and white for editorial and hero imagery. Grain is welcome; it comes from the reference photography.
- A duotone treatment of black over orange may be used on one image per page, never more.
- No stock-photo smiling, no white-background ecommerce cutouts in editorial slots, no lifestyle clutter.

## Voice

Short, flat, factual. Lowercase or sentence case, never exclamatory.

- Good: "34" inseam. In stock."
- Bad: "Finally! Jeans that fit YOU! 🎉"

No emoji. No exclamation marks. Numbers and measurements are shown as numbers.

---

## Don't

- Rounded corners, soft shadows, gradients, glassmorphism
- A second accent color
- Centered layouts or centered body text
- Pure white `#FFFFFF` as the page background
- Decorative icons or illustrations
- Animation that draws attention to itself
