---
name: pull-real-products
description: Find and pull real tall-size clothing products (with real photos) from Shopify-powered retailers, worldwide, using their public product feed. Use when the user asks to find more real brands/products/photos for TALLZ, expand the catalog, or "keep pulling brands."
---

# Pull Real Products (no affiliate approval or API key needed)

Some retailers build their site on Shopify, which by default exposes a public, unauthenticated `/products.json` feed — no login, API key, or affiliate approval required to read it. This skill finds retailers where that's true and pulls real tall-labeled products (with real photos) into the TALLZ database.

This is **not** a substitute for the affiliate program integrations (CJ Affiliate, Rakuten, Awin) — those cover way more retailers and pay commission. This is a free supplementary source that works for maybe 1 in 3 candidates checked, mostly smaller/DTC brands.

Already-pulled retailers (don't re-add): American Tall, Just Tall, Faherty Brand, Alloy Apparel, 2Tall, Tall by Design, Westport Big & Tall, Tall Size. Check `select name from public.retailers order by name;` via the Supabase MCP `execute_sql` tool first if unsure what's already in.

Confirmed **NOT usable**, don't recheck: ASOS, Zalando, Gap, Levi's, Uniqlo, Madewell, DXL, Johnny Bigg, Long Tall Sally, Next, Duluth Trading, Plus 2 Clothing, Tall Guy Menswear, Ayno, Bonobos, King Size, Marks & Spencer, Height-of-Fashion (Shopify but only a gift card listed), J.Crew Factory, Land's End, Talbots, Boohoo/boohooMAN, New Look, River Island, HIRMER, THE ICONIC, House of Tall, Highleytall, Jumping Ships. **Eddie Bauer is Shopify-confirmed but not usable** — its tall filtering runs through a custom `/view/...` faceted-search system, not real Shopify collections (its `/collections.json` has no tall-related handle), so the title-filter trick returns kids' items instead. Don't retry it without first finding a genuine `/collections/...` handle by other means.

## Steps

1. **Build a candidate list.** Sources, in order of usefulness:
   - `MARKET_RESEARCH.md` §3 has ~35 already-researched retailers — cross off ones already pulled or already confirmed NOT Shopify (ASOS, Zalando, Gap, Levi's, Uniqlo, Madewell, DXL, Johnny Bigg, Long Tall Sally, Next, Duluth Trading, Plus 2 Clothing, Tall Guy Menswear, Ayno, Bonobos, King Size are all confirmed non-Shopify or blocked from earlier passes — don't recheck these).
   - Do a fresh web search for "tall clothing brand" + region names not yet well covered (the research found Asia-Pacific especially thin — worth specifically searching there). Small/DTC/direct-to-consumer brands are much more likely to be on Shopify than large multi-brand retailers.

2. **Check each candidate** (fast, ~1 request):
   ```
   node scripts/pull-shopify-products.mjs check https://example.com
   ```
   This tells you immediately whether the trick works and previews a few product titles. If it says "NOT SHOPIFY," move on — don't try to force it (no scraping fallback here; that's a separate, higher-effort/higher-risk path covered in `MARKET_RESEARCH.md` §4.2).

3. **Pull confirmed candidates:**
   ```
   node scripts/pull-shopify-products.mjs pull https://example.com \
     --name "Brand Name" --country "USA" --type unisex --label "Tall" \
     --max 4
   ```
   - `--type` is `men`, `women`, or `unisex`.
   - `--label` is whatever the brand actually calls its tall sizing (e.g. "Tall", "LT", "Big & Tall") — check the check-mode output or the site itself.
   - If the check-mode output warned that no titles say "tall" (a general catalog, not a tall-specific one), find the brand's tall-specific collection URL first and pass it via `--path /collections/whatever-it-is`.
   - Add `--currency USD|GBP|EUR|AUD|NZD` if the auto-guess (based on domain) looks wrong — check by eye against the prices shown.
   - Add `--region EU|UK|US|AU|NZ|JP`, `--size-system` (usually the same as region), and `--shipping "NL,DE,FR"` (comma-separated country codes) if the domain-based guess is wrong — these drive the EU-only filter and "Ships to EU" hint on product cards, so get them right rather than leaving the guess unchecked. Shipping-country guesses are especially soft (based on TLD only, not the retailer's actual shipping policy) — treat them as a starting point to verify against the retailer's own shipping page, not a fact.

4. **Review the printed output before running anything.** The script prints a plain-English summary (category/fit/gender/price/currency per product) to the terminal *before* the SQL — read it. Common things to fix by hand in the SQL before running it:
   - Category guesses are keyword-based and imperfect (e.g. "sweatshirt" defaults to "Shirt" — you may want "Hoodie" or "Knitwear"). Edit the `category` values in the printed SQL directly.
   - Style tag guesses are a reasonable starting point, not gospel — adjust if a product clearly reads differently (e.g. a graphic tee tagged `minimal` should probably be `streetwear`).
   - **Fit guesses** (`slim`/`regular`/`relaxed`/`baggy`) are keyword-based too — slim/skinny/tapered → slim; oversized/boxy/baggy → baggy; relaxed/wide-leg/loose fit → relaxed; everything else defaults to `regular`. This matters now because the onboarding quiz asks for a fit preference and the algorithm boosts matches — a wrong guess here quietly skews recommendations, so don't skip checking it.
   - **Gender guesses** (`men`/`women`/`unisex`) come from explicit title cues first ("for tall men", "women's"), falling back to the `--type` you passed in. Check it — a general "Tall" catalog with `--type unisex` will tag everything unisex even if half the items are clearly one gender from the photo.
   - Currency: double check against the actual price level (a $228 blazer is not priced in AUD-and-shown-as-USD, for instance).
   - Drop any row that isn't a genuine tall garment (the script filters obvious junk like gift cards and checkout add-ons, but double-check).

5. **Identify color/material/pattern by eye — this is the step keyword-matching can't do.** The script downloads each candidate's photo to `./.pull-review-images/` and prints the local path next to each product in step 4's output. Open each photo (the `Read` tool displays images directly) and fill in the `color`, `material`, and `pattern` values in the printed SQL — they're generated as `null` and stay that way until you do this. Keep it simple and consistent: `color` is the dominant/primary color as a plain word (`"navy"`, `"olive"`, `"black"`), `material` is the fabric if visually obvious or stated in the title (`"cotton"`, `"denim"`, `"knit"` — leave `null` if you genuinely can't tell), `pattern` is `"solid"` for the common case or a real pattern word (`"striped"`, `"floral"`, `"plaid"`, `"graphic"`) when visible. Don't guess wildly at things you can't see in the photo — `null` is honest, a wrong value pollutes a real filter a shopper will use.

6. **Apply the SQL** via the Supabase `execute_sql` MCP tool against project `vcitwawndwowctyvbzlc`. The retailer insert and product+image inserts are one SQL block — run it as-is (after edits from steps 4–5).

7. **Fit measurements (`inseam_cm`/`sleeve_cm`/`body_length_cm`) are NOT set by this script.** Shopify's `/products.json` feed only has title/price/images — no measurements — so these columns stay `null` for everything this script pulls, and product cards will honestly show "Fit data not available" until someone manually looks up the retailer's own size chart per product and fills them in with a follow-up `update` statement. Don't guess numbers here; a wrong measurement is worse than none, since users may size against it.

8. **Verify:**
   ```sql
   select (select count(*) from public.retailers) as retailers,
          (select count(*) from public.products where active) as active_products,
          (select count(distinct product_id) from public.product_images) as products_with_photos;
   ```
   Then spot-check the site itself (`npm run dev --workspace=apps/web`, visit `/feed`) to confirm the new products render with real photos and no console errors — don't consider this done until you've actually looked at it in a browser.

## Notes

- This only works for Shopify-native stores. Bigger/legacy retailers (department stores, most fast-fashion chains) build custom platforms and will always fail the check — that's expected, not a bug to work around.
- Currency support in the app currently covers USD, GBP, EUR, AUD, NZD (`apps/web/src/lib/products.ts`). If a new region needs a different currency, add it there and to `currencySymbol()` first.
- Keep pulling in small batches (3-5 retailers at a time) and verify in the browser after each batch, rather than blindly running many SQL blocks back to back — a bad category/currency guess is easy to catch by eye and annoying to clean up later if it piles up.
