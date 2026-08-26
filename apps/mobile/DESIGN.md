# DESIGN.md — TallZ

Design rules for the TallZ **mobile app** (`apps/mobile`, Expo + React Native). Follow these unless told otherwise.

The tokens below live in code at `apps/mobile/src/lib/theme.ts` — that file is the implementation, this doc is the reasoning. Change both together.

**Web note:** `apps/web` is now the admin panel only (founder call, 2026-08-26 — see `CLAUDEMODE.md` §6). Its public pages are being retired. Where a rule below mentions the website, it is history kept for context, not a live instruction.

**What TallZ is:** an aesthetic closet you carry on your phone — affordable tall-fit clothing, presented like a fashion drop, one tap from checkout on the seller's own site. "Cheap fashion in a high-fashion jacket": the pieces are accessible, the presentation isn't. Feed-native, algorithm-driven, built to be pleasant to scroll, not a spreadsheet with photos.

This supersedes the earlier "Swiss design poster" direction (hard corners, mono labels everywhere, cold black/white/orange) — that system is retired. Founder call: it read as expensive/boutique rather than "affordable fashion, elevated." Rounded, warm, and app-like is now the rule, not the exception.

---

## Colors

Pure monochrome — founder call, 2026-07-30, reversing the brief warm/cobalt period. No color accent at all.

```css
--background: #FFFFFF; /* pure white — no warm tint */
--foreground: #000000; /* pure black */
--card:       #FFFFFF; /* same as background — no separate tint */
--muted:      #737373; /* neutral grey, no color cast */
--line:       #0000001F; /* hairline borders, ~12% black */
--accent:     #000000; /* no color accent — black (or white, on a black surface) only */
```

Rules:

- No color anywhere. Not cobalt, not orange, not a "warm neutral" — black, white, and grey only.
- `--card` is intentionally identical to `--background` now — product photography provides the visual interest, panels don't need their own tint.
- Where something needs to stand out (a CTA, a badge), use solid black on white or solid white on black — contrast does the work color used to.

## Typography

One family, two weights doing different jobs — the old mono-for-labels convention is gone.

```css
--font-display: "Archivo", "Helvetica Neue", Arial, sans-serif; /* everything: headings, body, labels, prices */
```

Sizes (as shipped in `theme.ts` — React Native takes absolute numbers, there is no `clamp`):

| Use | Size / line-height | Weight | Notes |
|---|---|---|---|
| Hero | 40 / 42 | 700 | Tight, `letterSpacing: -0.8` |
| H1 | 28 / 32 | 700 | Screen titles |
| H2 | 20 / 25 | 700 | Section and wordmark |
| Body | 16 / 24 | 400 | |
| Small | 14 / 20 | 400 | Product names, secondary copy |
| Label / meta | 11 / 14 | 600 | UPPERCASE, `letterSpacing: 1.1` — same family as headings, never a mono face |
| Price | 15 / 20 | 700 | Same sans, never monospace |

Archivo is loaded through `@expo-google-fonts/archivo` and referenced by its four weight names (`Archivo_400Regular` … `Archivo_700Bold`). React Native has no font synthesis worth relying on, so a weight that isn't loaded silently falls back — add the weight to the `useFonts` call in `src/app/_layout.tsx` before using it.

Rules:

- The oversized wordmark moment (hero headline over a photo) is the one place to be genuinely loud — Off-White/travel-site energy. Everywhere else stays calm.
- Labels/meta are still uppercase and tracked, but they're a heavier weight of the same sans now, not a separate mono typeface — the app should feel like one voice, not a poster plus a spec sheet.
- Body copy is plain sentence case.

## Layout

Phone-native. There is no desktop breakpoint to design toward any more — the constraint is a ~375pt-wide screen with a notch at the top and a home indicator at the bottom.

Rules:

- **Safe areas are not optional.** Every screen wraps in `SafeAreaView` from `react-native-safe-area-context`. Content that ignores them ends up under the notch or the home indicator on real hardware — and this is invisible in the browser preview, so it must be checked on a device.
- **44pt minimum tap target** (`MIN_TAP` in `theme.ts`), the floor both platforms publish. A visually small control (a heart, a text link) still needs 44pt of touchable area — use `hitSlop` rather than inflating the visual.
- Chips, cards, and rails scroll horizontally where that reads as natural (category filters, quick collections).
- Spacing comes from `gap` and the `space` scale in `theme.ts`, not ad-hoc margins.
- One bold moment per screen (oversized type over a photo); everything around it stays quiet.
- Thin hairline rules still separate sections — kept from the old system, still restrained.

## Access & accounts

**Everything requires an account.** There is no public browsing surface in the app: the root layout redirects to `/login` whenever there is no session, and away from `/login` once there is one. This is stricter than the old website, which kept a public landing page — a phone app has no equivalent of a shareable landing URL, so the shop-window job moves to the store listing screenshots instead.

The redirect waits on an explicit `ready` flag from the auth provider. Redirecting before the stored session has been read out of SecureStore would bounce a returning, signed-in user to the login screen on every cold start.

## Screen structure

Routes live in `apps/mobile/src/app` (expo-router, file-based). Four tabs, mirroring what the website's nav offered:

- **`(tabs)/index.tsx` — Home.** The website's homepage, adapted: eyebrow, hero headline, the logo mark on a black card, the full-bleed statement band, then "The newest finds" as a two-column grid. Same shop-window rule as the web version — recent, photographed, round-robined across retailers. Carries the consent prompt and the quiz prompt.
- **`(tabs)/search.tsx` — Search.** Text search over name and retailer, plus the quick filter chips (inseam, sleeve, gender, EU) in a horizontal rail. Filtering reuses `applyCatalogFilters`.
- **`(tabs)/explore.tsx` — Explore.** The full-screen snap-paging swipe feed with like/skip and "Shop this", ported from the website's `/explore`.
- **`(tabs)/account.tsx` — Account.** Email, saved quiz answers, a link back into the quiz, the consent toggle, and log out.
- **`login.tsx` / `signup.tsx`** — outside the tabs. Errors go through the shared `genericAuthMessage` so raw provider text never reaches the UI. Signup shows a "check your email" state rather than appearing to do nothing when email confirmation is on.
- **`onboarding.tsx`** — outside the tabs, six steps: height, proportion, swipe deck, occasions, fit, budget. Prefills from the last saved answers.

**Tabs are text-only, no icons.** `@expo/vector-icons` stays installed because expo-router depends on it internally, but nothing in this app imports it: its font assets were fragile to resolve from this monorepo layout, and uppercase tracked labels are the house style anyway.

Not built yet: password reset, the photo-upload step the website's quiz had (step 7, optional there), and account deletion — that one still lives on the web admin.

## Consent

Nothing is tracked until the user answers the consent prompt on the feed — `getConsent()` returning `null` means "not asked yet", and `trackProductEvent` no-ops. Outbound links to retailers work regardless; consent only gates whether the interaction is logged. This is the same two-state model as the web app, backed by AsyncStorage instead of localStorage.

## Components

**There is no hover on touch.** Every rule that used to say "hover inverts fill" now means the **pressed** state, expressed through `Pressable`'s `({ pressed })` style callback. Reducing opacity to ~0.7–0.8 while pressed is the house style; no scale, no shadow.

**Buttons** — rounded pill (`radius.pill`). Primary is solid black with white text, 52pt tall. Secondary is a 1px black outline on transparent. Uppercase label using `type.label`. Disabled drops to 0.4 opacity. A button doing async work shows an `ActivityIndicator` in place of its label rather than staying inert.

**Product cards** — `colors.card` surface, `radius.card` (16pt), no border. Image at 3:4 portrait with a rounded save-heart overlaid top-right and a small rounded "fit" badge bottom-left (e.g. "91cm inseam"). Below: brand in `type.label` muted, product name in `type.small` (max 2 lines), price in `type.price`. The whole card is the tap target for opening the retailer; the heart is a nested `Pressable` with `hitSlop`.

**Outbound links** — always `WebBrowser.openBrowserAsync`, never `Linking.openURL`. The in-app browser returns the user to their place in the feed; kicking them out to Safari loses the session and the scroll position. Every outbound tap logs a `click` event first — the affiliate model depends on it.

**Filters** — rounded pill chips in a horizontally-scrollable row, active state filled black. Tall-specific measurements (inseam, sleeve, height range) stay the primary filter. *(Not built yet.)*

## Motion

Restrained.

- 150–250ms for state changes.
- Not allowed: bounce, spring, parallax, scroll-jacking, animated gradients, decorative loops.
- The web app's `prefers-reduced-motion` rule has a native equivalent: `AccessibilityInfo.isReduceMotionEnabled()`. Honour it if any non-trivial animation is ever added — right now there is none to gate.

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

- Any color accent — no orange, no cobalt, nothing. Black, white, grey only.
- A separate mono/monospace typeface for labels — one family only
- Centered body text
- Animation that draws attention to itself
- Tap targets under 44pt, or screens that skip `SafeAreaView`
- `Linking.openURL` for retailer links — it drops the user out of the app
