# TALLZ — Market & Technical Research

Prepared as a working reference for the open decisions flagged in [CLAUDEMODE.md](./CLAUDEMODE.md#6-open-decisions--ask-dont-assume). Covers community research, a working definition of "tall sizes," a worldwide retailer landscape, the product-ingestion technical problem, relevant MCP tooling, and a phased implementation plan.

**A note on method:** sections 1, 3, and 5 were researched via live web search (sourced inline). Reddit itself was not directly reachable from this environment, so §1 leans on secondary sources instead — flagged clearly there. Sections 2, 4, and 6 are synthesized from that research plus standard e-commerce/data-engineering practice — flagged as reasoning rather than citation where relevant.

**A strategic flag worth resolving early:** the stated target audience is 190cm+ (roughly top 1% of men, well under 1% of women worldwide). Every retailer's actual "tall" sizing threshold found in this research starts well below that — typically ~183–185cm for men and ~173–175cm for women (§2.1). That's not a contradiction, but it is a decision the team should make deliberately rather than by default: **serve only the 190cm+ segment** (smaller, underserved even by "tall" lines, less competition) or **serve the full industry-standard tall market** (larger addressable audience, more retailer inventory to aggregate, closer to what "tall sizing" means everywhere else). This changes the retailer list in §3, the size filter logic in §4, and the marketing angle in §1 — worth a five-minute team decision before Phase 1 below is treated as finished.

---

## 1. Tall People Communities — What They Actually Say

**Access caveat, stated up front:** Reddit itself (r/tall, r/tallfashion, r/TallMen, r/TallWomen) was **not directly accessible** from this research environment — both the site and its public JSON endpoints were blocked, and web search returned no indexed thread content. Everything below comes from **secondary sources** instead: tall-fashion blogs, a journalistic piece that directly interviewed 69 tall people ([Bustle](https://www.bustle.com/fashion/we-talked-to-69-tall-people-about-shopping-for-clothes-that-actually-fit-10089460)), community forum threads, and retailer roundups. Treat this as a solid working foundation, not a substitute for direct community mining — see §5's note on Reddit MCP options if you want to close that gap properly later.

### Top styles

- **Casual/everyday basics** dominate — tall-cut t-shirts, jeans, and layering pieces (Old Navy, Gap, J.Crew), chosen specifically for proportional length rather than just a size up.
- **Workwear/professional** — tall lines from Ann Taylor, Banana Republic, J.Crew, Brooks Brothers for longer torsos/sleeves in office wear.
- **Streetwear** — layering longer tees under fitted jackets, vertical stripes to elongate, oversized silhouettes used deliberately but kept in check at the shoulder/waist.
- **Athleisure** — Athleta Tall, Lululemon, Nike/Under Armour tall or long-inseam lines mentioned repeatedly.
- **Premium/luxury** — Reiss, Jigsaw, Reformation Tall, Eileen Fisher, Hobbs London, Boden as elevated options in women's roundups.

**Recurring, well-corroborated complaints tied to tall proportions** (this is the useful part for product design):
- Sleeve length: *"Most of my shirts with longer sleeves are 3/4 sleeve length on me, but were made to be full length"* (Bustle interviewee).
- "Flood pants" — sleeves stopping mid-forearm, pants becoming unintentional capris.
- Torso/rise: *"All my height is in my waist"* — shirts and dresses too short in the body even when sleeves/inseam are fine.
- Armhole depth complaints on the women's side (single-source stylist claim, not independently verified).
- Men's-side equivalent: short sleeves, high-riding trousers, and "sizing up in width without corresponding length" as a workaround that doesn't fix the real problem.

**Product implication:** the recurring complaint isn't "no tall option exists," it's "the tall option I found still isn't cut right." This supports the platform's discovery/curation angle over pure aggregation — surfacing which specific pieces actually solve sleeve/torso/rise proportions (not just which retailers carry a "Tall" label) is where the real value is.

### Shopping frequency

No source gave a clean weekly/monthly/seasonal number — that data point isn't available from what's accessible. What is consistently reported:
- **Strong brand loyalty once a fit is found**: *"Once I've found something I love… I tend to just stick to that"* (Bustle survey). Channel split was roughly even: 53% mostly in-store/some online, 41% mostly online/some in-store.
- **Scarcity-driven urgency buying** — plausible and repeatedly implied (Wardrobe Oxygen: tall/tall-plus sizes "sell out faster than other sizes"; Miolook advises buying early because "popular tall sizes vanish fast") but not directly quoted by a community member in what's accessible here — treat as a well-supported inference, not a confirmed behavioral fact.
- **Secondhand marketplaces** (Depop, ThredUp, eBay) as a tall-shopping channel — **not corroborated** by any verifiable source in this pass. Real gap, not a negative finding; worth a targeted follow-up once direct Reddit access exists.

### Top 10 most-mentioned retailers/platforms

| Rank | Retailer | Region/Type | Why mentioned |
|---|---|---|---|
| 1 | Long Tall Sally | UK/US, tall specialist (women's) | Named in nearly every women's source as the pioneering tall-only label; true proportional sizing up to 38" inseam |
| 2 | American Tall | US, tall specialist (unisex) | Most-mentioned unisex tall-specific brand across both men's and women's sources |
| 3 | ASOS / ASOS Tall | Global, mainstream with tall line | Repeated as the trend-forward, accessible tall option |
| 4 | Old Navy (Tall) | US, mainstream/budget | Most-cited affordable/basics tall line on both men's and women's side |
| 5 | Gap / Gap Tall | US, mainstream | Everyday basics; added tall/petite options to core lines |
| 6 | Levi's | US, denim specialist | Called out specifically for adjusting knee position/rise, not just leg length |
| 7 | Universal Standard | US, size-inclusive mainstream | Extended tall + size range (00–40 tall) |
| 8 | Madewell | US, denim/casual | "Denim perfectionists" — tall/taller denim lines called out independently twice |
| 9 | J.Crew / J.Crew Tall | US, mainstream workwear-casual | Tall fits in classics and denim |
| 10 | Nordstrom / DXL & Westport Big & Tall (tie) | US, department store / men's specialist | Nordstrom as a broad multi-brand tall stockist; DXL/Westport as the top dedicated big-and-tall chains on the men's side |

**Sources:** [Bustle](https://www.bustle.com/fashion/we-talked-to-69-tall-people-about-shopping-for-clothes-that-actually-fit-10089460), [Racked](https://www.racked.com/2018/1/24/16911166/tall-woman-shopping), [Wardrobe Oxygen](https://www.wardrobeoxygen.com/plus-size-tall-clothing-retailers/), [Rank & Style](https://www.rankandstyle.com/articles/best-tall-womens-clothing-brands), [Miolook](https://miolook.com/en/best-clothing-brands-tall-women), [TheCurvyFashionista](https://thecurvyfashionista.com/tall-and-plus-size-16-places-to-shop-and-more/), [TheTallGuyGuide](https://thetallguyguide.com/Brands), [TallTogs](https://talltogs.com/blogs/news/the-best-tall-mens-brands-youve-never-heard-of), [Truwear](https://www.truwear.com/blogs/news/finding-the-perfect-fit-top-u-s-brands-for-taller-men).

---

## 2. Defining "Tall Sizes"

### 2.1 Working definition

"Tall" sizing is not a single standard — it's brand-defined, and every brand sets its own height threshold. But across the market, a consistent pattern holds: **tall sizing adds length to torso, sleeve, and inseam while holding chest/waist/hip measurements constant.** It is a different proportion, not a bigger regular size with extra fabric at the hem — a properly cut tall garment adjusts the rise and shoulder-to-cuff geometry, not just the finished length.

Rough thresholds observed across brands ([American Tall sizing guide](https://americantall.com/blogs/we-the-tall/a-guide-to-sizing-tall-clothing), [Long Tall Sally size chart](https://www.longtallsally.com/tall-size-chart), [ASOS size charts](https://www.asos.com/us/discover/size-charts/)):

| Segment | Typical "tall" threshold | Notes |
|---|---|---|
| Men | ~6'1"–6'2" (185–188 cm) and up | Some brands start as low as 6'0" (183 cm); big-and-tall retailers often combine "tall" with "big" (wider) sizing as a single expanded category. |
| Women | ~5'8"–5'9" (173–175 cm) and up | Specialist brands (Long Tall Sally, American Tall) size up to ~6'6" (198 cm). |
| Kids | No consistent standard | A handful of US retailers (Land's End Kids, Old Navy) offer combined "husky/tall" kids sizing, but it's a minor, inconsistently defined category — **not a priority segment for v1** given how thin the market is. |

This app's stated audience (190 cm / 6'3" and up) sits comfortably inside "tall" for men by every brand's definition, and well above the women's threshold — meaning the addressable retailer pool is the full tall-size market, not a narrow slice of it.

### 2.2 Measurement/label reference table

| Category | Regular indication | Tall indication | Length added (typical) |
|---|---|---|---|
| T-shirt / casual top | S–XL | "Tall" / "LT" (Long-Tall) | +5–10 cm (2–4") body length |
| Dress shirt | Neck/sleeve, e.g. 16/34 | Same neck, sleeve +1" | +2.5 cm sleeve, same collar |
| Sweater / knitwear | S–XL | "Tall" | +5 cm body length |
| Jacket / coat | 40R (regular) | 40L (long) | +5–7.5 cm body, +5 cm sleeve |
| Suit jacket + trouser | e.g. 40R | 40L | Jacket +5 cm; trouser inseam +5–7.5 cm |
| Trousers / chinos | Inseam 81 cm (32") | Inseam 86–97 cm (34"–38"+) | +5–15 cm depending on height band |
| Jeans | Inseam 81 cm (32") | Inseam 86–97 cm (34"–38"+), sometimes to 40" | Same as trousers; rise also adjusted |

**Source basis:** [Land's End size charts](https://www.landsend.com/_size_charts/core_12_sizechart_mns_shirts_polos.html), [American Tall — how tall clothes differ](https://americantall.com/blogs/we-the-tall/how-are-tall-clothes-different), [Tall Size — inseam guide](https://www.tallsize.com/blogs/tall-size-blog/what-inseam-length-should-i-get), [KnowledgeNuts — tall vs regular explained](https://knowledgenuts.com/2026/06/29/tall-vs-regular-sizes-explained/).

**Product implication:** the platform's size-filtering logic can't rely on a single numeric cutoff — it needs a per-category, per-brand mapping table (see §4.4 schema, `tall_sizes`), because "Tall" on one brand's jeans and "Tall" on another's dress shirts represent different absolute measurements. This is a real data-modeling requirement, not a nice-to-have.

---

## 3. Worldwide Retailer / Seller List

Compiled via live web search across North America, UK/Europe, Australia/NZ, and Asia-Pacific. URLs point to specific tall category pages where one was confirmed to exist; entries without one are marked "(general site, tall section not confirmed)."

| Retailer | Region | Clothing Type | Tall Size Label Example | URL |
|---|---|---|---|---|
| DXL (Destination XL) | USA | Men | "LT" (Large Tall) up to 6XLT | [dxl.com](https://www.dxl.com/) |
| King Size | USA | Men | "Big & Tall" | [kingsize.com](https://www.kingsize.com/) |
| Westport Big & Tall | USA | Men | "Big & Tall" | [westportbigandtall.com](https://www.westportbigandtall.com/) |
| American Tall | USA | Men & Women | "Tall" (up to 7'1") | [americantall.com](https://americantall.com/) |
| Bonobos | USA | Men | "Extended Sizes" (Big & Tall) | [bonobos.com/shop/extended-sizes](https://bonobos.com/shop/extended-sizes/tops) |
| Gap | USA | Men & Women | "Tall" | [gap.com/shop/tall-jeans](https://www.gap.com/shop/tall-jeans) (women); [Men's Tall Shop](https://www.gap.com/browse/category.do?cid=1026756&style=1026780) |
| Old Navy | USA | Men & Women | "Tall" | [oldnavy.gap.com/browse/women/tall](https://oldnavy.gap.com/browse/women/tall?cid=3054308) |
| Banana Republic | USA | Men & Women | "Tall" | [bananarepublic.gap.com](https://bananarepublic.gap.com/) (general site, tall section not confirmed) |
| J.Crew / J.Crew Factory | USA | Men & Women | "Tall" | [factory.jcrew.com …shirts/tall](https://factory.jcrew.com/plp/mens/categories/clothing/shirts/tall) |
| Madewell | USA | Women | "Tall/Taller" | [madewell.com/womens/.../tall-taller](https://www.madewell.com/womens/clothing/more-sizes/tall-taller/) |
| Land's End | USA | Men & Women | "LT" / "Tall" | [landsend.com/shop/mens-tall](https://www.landsend.com/shop/mens-tall/S-y5b-ww6-16t5) |
| Talbots | USA | Women | "Tall" | [talbots.com/clothing/pants/long-tall](https://www.talbots.com/clothing/pants/long%2Ftall) |
| Alloy Apparel | USA | Women (incl. teen/girls) | "Tall" (35"–39" inseam) | [alloyapparel.com/.../womens-tall-jeans](https://www.alloyapparel.com/collections/womens-tall-jeans) |
| Faherty Brand | USA | Men | "Tall Collection" | [fahertybrand.com/.../mens-tall-collection](https://fahertybrand.com/collections/mens-tall-collection) |
| Just Tall | USA | Men | "Tall Slim" (6'2"+) | [justtall.com/en-us](https://justtall.com/en-us) |
| Duluth Trading Co. | USA | Men | "Big and Tall" | [duluthtrading.com/men/big-and-tall](https://www.duluthtrading.com/men/big-and-tall) |
| Levi's | USA | Men | "Big & Tall" | [levi.com .../big-tall/jeans](https://www.levi.com/US/en_US/big-tall/jeans/c/levi_clothing_men_big_tall_jeans) |
| Nordstrom | USA | Men | "Big & Tall" (multi-brand) | [nordstrom.com/browse/men/big-tall](https://www.nordstrom.com/browse/men/big-tall) |
| Eddie Bauer | USA | Men & Women | "Tall" | [eddiebauer.com](https://www.eddiebauer.com/) (general site, tall section not confirmed) |
| Long Tall Sally | UK | Women | "Tall" (sizes 8–24, up to 38" inseam) | [longtallsally.com/clothing](https://www.longtallsally.com/clothing) |
| ASOS | UK | Men & Women | "Tall" | [asos.com/women/tall/cat](https://www.asos.com/women/tall/cat/?cid=18984); [asos.com/us/men/tall/cat](https://www.asos.com/us/men/tall/cat/?cid=20753) |
| Boohoo / boohooMAN | UK | Women & Men | "Tall" | [boohoo.com/.../womens-tall](https://www.boohoo.com/categories/womens-tall); [boohooman.com/.../tall-clothing](https://www.boohooman.com/eu/mens/tall-clothing) |
| PrettyLittleThing | UK | Women | "Tall" (5'9"+) | [prettylittlething.com/.../womens-tall](https://www.prettylittlething.com/categories/womens-tall) |
| New Look | UK | Women | "Tall" | [newlook.com/uk/womens/tall-clothing](https://www.newlook.com/uk/womens/tall-clothing/c/uk-womens-tall-clothing) |
| River Island (via Next) | UK | Men & Women | "Tall" | [next.co.uk .../tall](https://www.next.co.uk/shop/gender-men-productaffiliation-clothing/brand-riverisland-plussizetall-tall) |
| Next | UK | Men & Women | "Tall" filter | [next.co.uk](https://www.next.co.uk/) (general site, has dedicated Tall filter) |
| Marks & Spencer | UK | Men & Women | "Tall" / "Big & Tall" | [marksandspencer.com/l/women/tall](https://www.marksandspencer.com/l/women/tall/); [men/big-and-tall](https://www.marksandspencer.com/l/men/big-and-tall) |
| Zalando | Germany/NL (pan-EU) | Men & Women | "Tall" assortment filter | [zalando.co.uk/clothing/?assortment_area=tall](https://www.zalando.co.uk/clothing/?assortment_area=tall) |
| 2Tall | UK | Men | "Tall" (36"–40" inseam) | [us.2tall.com](https://us.2tall.com/) / [row.2tall.com](https://row.2tall.com/) |
| Allta Clothing | UK | Women | "Tall" | [allta.co.uk](https://allta.co.uk/) (general site, tall section not confirmed) |
| Ayno | France | Women | "Grande Taille" / Tall | [aynos.fr](https://aynos.fr/) (general site, tall section not confirmed) |
| HIRMER | Germany | Men | Plus/Tall menswear | [hirmer.de](https://www.hirmer.de/) (general site, tall section not confirmed) |
| THE ICONIC | Australia/NZ | Men | "Big & Tall" | [theiconic.com.au/mens-plussize-clothing](https://www.theiconic.com.au/mens-plussize-clothing/) |
| Johnny Bigg | Australia | Men | "Tall" (LT–6XLT, 190cm+) | [johnnybigg.com.au/au/tall](https://www.johnnybigg.com.au/au/tall) |
| Tall Guy Menswear | Australia | Men | "Tall" | [tallguy.com.au](https://www.tallguy.com.au/) |
| Plus 2 Clothing | Australia | Men | "Tall" (extra long) | [plus2clothing.com/tall-mens-clothing](https://plus2clothing.com/tall-mens-clothing/) |
| Height-of-Fashion | Australia | Women | "Tall" | [height-of-fashion.com](https://height-of-fashion.com/) |
| Tall by Design | New Zealand | Women | "Tall" | [tallbydesign.co.nz](https://tallbydesign.co.nz/) |
| Uniqlo | Japan (HQ) / Global | Men & Women | "Tall" length option | [uniqlo.com/.../tall](https://www.uniqlo.com/us/en/men/bottoms/ankle-pants/tall) |

**Gaps observed:**

- **Asia-Pacific is genuinely thin.** Despite targeted searches (Japan, Korea, China), no dedicated *height-based* tall-size retailers surfaced — only plus-size brands (e.g. PUNYUS in Japan, JStyle/HOTPING in Korea) that size for circumference/weight, not length/inseam. Uniqlo is the only Japan-headquartered brand with an explicit "Tall" length option, and it's most visible on its US/UK sites rather than its home market. **This looks like a genuine whitespace opportunity** for a tall-size aggregator targeting APAC — worth flagging as a strategic option, not just a data gap.
- **Women's tall is more mature than men's tall in the UK/EU DTC space** — Long Tall Sally, Alloy Apparel, PrettyLittleThing, and Height-of-Fashion all have long-established dedicated ranges, while comparable men's-only specialists are rarer outside the US (DXL, King Size) and Australia (Johnny Bigg, Tall Guy, Plus 2).
- **"Tall" labeling is inconsistent across the market** — some brands use height-anchored fits ("Tall," "LT," "Long"), others bundle tall into "Big & Tall" (blurring waist and length), and a few (Next, Banana Republic, Eddie Bauer) only expose tall via internal size filters rather than a stand-alone URL. This is exactly why the `tall_sizes` normalization table in §4.4 needs to exist — the platform has to build the consistent taxonomy the market doesn't provide.
- **Continental Europe (non-UK) coverage is comparatively sparse** — Zalando is the strongest pan-EU aggregator with an explicit tall filter; standalone specialists (Ayno in France, HIRMER in Germany) exist but are smaller and less English-documented, suggesting local-language research would surface more.
- **Big-box retailers increasingly bolt tall onto "Big & Tall" for men** (Gap, M&S, Levi's, THE ICONIC) rather than a pure height-only line — a differentiator this platform could highlight for slim-tall shoppers underserved by combined big+tall inventory.

---

## 4. Technical Problem: Getting Items From the Seller's Page Onto This Site

### 4.1 The problem, stated precisely

For every product shown on this platform, two pieces of retailer-owned content are needed:
1. A working link back to the exact product page on the retailer's site (so the user can actually buy it — this platform doesn't hold inventory).
2. A photo of the item as worn by a model on the retailer's page (product-only flat-lay shots don't sell the "this looks good on a tall frame" story the app is built around).

Both pieces of content are owned and hosted by the retailer, not by this platform. That's the core constraint every option below has to solve for.

### 4.2 Options analysis

| Approach | How it works | Scalability | Ethical/legal footing | Technical effort | Verdict |
|---|---|---|---|---|---|
| **Manual linking** | A human finds products, copies the link + image URL by hand into the database. | Very low — doesn't scale past a few hundred SKUs before it's a full-time job. | Clean — no ToS risk, images used are just hyperlinked/embedded with normal fair-use browsing patterns. | Minimal (a simple admin form). | Good for **bootstrapping and quality control**, not for scale. |
| **Automatic scraping** | A scraper (headless browser or HTTP fetch) visits retailer product pages, extracts image URLs, price, and links. | High, in principle — but brittle: every retailer's HTML changes, breaking scrapers regularly, and many sites have anti-bot protection. | **Risky.** Most retailer ToS explicitly prohibit scraping; robots.txt often disallows it; hot-linking a retailer's model photos onto a competing commercial platform is a copyright exposure even if the scrape itself succeeds. This is the one to be most careful with. | High (per-retailer maintenance burden). | Use only as a **fallback**, retailer-by-retailer, after checking that specific retailer's ToS/robots.txt — never as the default ingestion method. |
| **API integrations** | Retailer exposes a structured product API/feed (REST API, Shopify Storefront/Catalog API, Google Merchant feed) that returns product data including image URLs, meant for third-party consumption. | High — this is what these APIs exist for. | Clean — this is exactly the sanctioned use case. | Medium (one integration per API type, reusable across retailers on the same platform, e.g. all Shopify-based brands). | **Best option where available.** |
| **Affiliate links / partner programs** | Join a retailer's affiliate program (direct, or via a network like CJ Affiliate, Rakuten Advertising, Awin), which provides a product feed (including images) *and* a tracked link that pays commission on referred sales. | High — one network integration can cover hundreds of retailers' feeds at once. | Clean, and it's the intended commercial use of the data — the retailer wants this. | Medium (network API integration, one-time per network). | **Best option overall** — solves data sourcing and monetization simultaneously. |

### 4.3 Recommendation

**Affiliate network feeds as the primary path, API integrations (like Shopify's Catalog API) as a secondary path for brands not on a network, manual curation to fill gaps and do quality control, and scraping only as a last resort with per-retailer legal review.**

Reasoning: affiliate networks (CJ Affiliate, Rakuten Advertising, Awin — see the earlier research in this repo's history) already solve the "am I allowed to use this image and link" question, because the retailer opted in specifically so third parties would republish their products. It also means every product shown on the platform can carry a monetization path from day one, without needing a separate ad-sales or subscription motion before the catalog even exists.

### 4.4 System design

**Database schema (simplified, relational):**

```
retailers
  id, name, country, website_url,
  ingestion_method   -- enum: affiliate_feed | api | manual | scrape
  affiliate_network  -- nullable: 'cj' | 'rakuten' | 'awin' | 'direct' | null
  tall_size_notes    -- free text, brand-specific sizing quirks

products
  id, retailer_id (fk), external_product_id,
  name, description, category, price, currency,
  product_url,            -- outbound link to retailer page (affiliate-tagged if applicable)
  last_synced_at, active

product_images
  id, product_id (fk), image_url, is_model_shot (bool), sort_order

tall_sizes
  id, product_id (fk),
  size_label,        -- e.g. "Tall", "LT", "34L"
  size_system,        -- e.g. "US", "UK", "EU"
  measurement_type,   -- e.g. "inseam", "sleeve", "body_length"
  measurement_cm

affiliate_links
  id, product_id (fk), network, tracking_url, commission_rate, generated_at

ingestion_jobs
  id, retailer_id (fk), source_type, status, run_at, items_ingested, errors
```

**Data flow:**

```
Retailer (feed / API / manual entry / [scrape])
        │
        ▼
Ingestion service  ──  one connector per source type
        │  • normalizes fields to the schema above
        │  • maps each retailer's size label → tall_sizes measurement_cm
        │  • dedupes against existing products
        │  • flags anything that fails validation for manual review
        ▼
products DB (Postgres / Supabase — already provisioned for this project)
        │
        ▼
API layer  ──  serves normalized product + image + link data to the frontend
        │
        ▼
Frontend (discovery feed)  ──  every product card links out via the tracked
                                affiliate URL; the platform never touches
                                checkout or inventory
```

**Roles:**

| Role | Responsibility |
|---|---|
| Ingestion/scraper service | Scheduled jobs per retailer/network; normalizes and validates incoming product data. |
| Admin/curation tool | Human review queue for flagged items, manual entry for retailers without a feed, image QA. |
| API layer | Read-optimized access to the products table for the frontend; also where affiliate-link generation happens on outbound clicks. |
| Frontend | Zara-style discovery feed; every card is read-only against the API, no write path back to retailer systems. |

---

## 5. MCP Servers & Skills

Reference: task numbers below refer to (a) e-commerce data extraction, (b) retailer/product search aggregation, (c) Reddit community research.

| Name | What it does | Install/usage | Best for |
|---|---|---|---|
| **Firecrawl MCP** (official) | Scrapes/crawls sites into clean markdown or JSON; has an LLM-powered "extract" mode for pulling structured fields (price, title, image URL) off a page. | `env FIRECRAWL_API_KEY=fc-YOUR_KEY npx -y firecrawl-mcp` (API key required; self-hostable) | (a) |
| **Bright Data MCP** | Real-time web access with built-in anti-bot/CAPTCHA/proxy handling; explicitly marketed for e-commerce/price-intelligence scraping. | `npx @brightdata/mcp` with `API_TOKEN` env var (free tier: 5,000 credits/mo) | (a), secondarily (b) |
| **Apify MCP Server** | Exposes Apify's marketplace of 5,000+ pre-built "Actors" — many are retailer-specific scrapers (Amazon, Zalando, ASOS, etc.) — as MCP tools, plus custom crawl jobs. | Hosted: `https://mcp.apify.com/` (no install). Local stdio alt: `@apify/actors-mcp-server`. Pay-per-run. | (a) |
| **Playwright MCP** (Microsoft, official) | General browser automation via accessibility-tree snapshots — navigate, click, fill forms, extract content. Infrastructure layer, not a packaged retail scraper. | `npx @playwright/mcp@latest` | (a) — for sites with no API/feed |
| **SerpApi MCP Server** (official) | Wraps SerpApi's multi-engine scraping (Google Shopping, Bing, eBay, Walmart, Amazon, etc.) into MCP tools; shopping results return as structured JSON (price, seller, thumbnail, link). | Hosted: `https://mcp.serpapi.com` (API key), or self-host from `serpapi/serpapi-mcp` | (b), also usable for structured (a)-style pulls |
| **Exa MCP** (official) | Neural/semantic web search and crawling — general-purpose, useful for retailer discovery ("which sites sell X"). | Hosted: `https://mcp.exa.ai/mcp` (free tier, no key). Local: `npx -y exa-mcp-server` with `EXA_API_KEY`. | (b) |
| **Shopify Storefront MCP** (official) | Lets an agent search catalog/manage cart — but scoped to **one Shopify merchant's store** via that store's own Storefront API, not a cross-retailer aggregator. | Merchant-specific hosted endpoint per store (see `shopify.dev/docs/apps/build/storefront-mcp`); no generic install command since it's store-scoped. | Only useful integrated one Shopify-powered retailer at a time — not an aggregator shortcut |
| **reddit-mcp-server** (jordanburke) | Read/write Reddit access via Reddit's official OAuth API (posts, comments, subreddit search); rate-limited by default. | `npx reddit-mcp-server`, needs `REDDIT_CLIENT_ID`/`REDDIT_CLIENT_SECRET` from a Reddit app at reddit.com/prefs/apps | (c) |
| **reddit-mcp** (GeLi2001) | Read-only Reddit browsing/search via the official app-only API (no user OAuth needed). | `uv sync && uv run reddit-mcp-tool`, needs `REDDIT_CLIENT_ID`/`REDDIT_CLIENT_SECRET`/`REDDIT_USER_AGENT` | (c) |

**On Reddit specifically:** there's no Reddit-published official MCP server, but there are genuinely OAuth-API-based third-party ones — `reddit-mcp-server` and `reddit-mcp` above are the two most credible. A few other repos (`mcp-server-reddit`, `reddit-mcp-buddy`) advertise "no API key needed," which means they hit Reddit's unauthenticated public JSON endpoints rather than the official API — worth avoiding given Reddit's API has been a contentious, paid surface since 2023. None of these are installed in this Claude Code session yet; adding one is a prerequisite before task 1's research could be automated end-to-end rather than done via general web search (which is how §1 below was actually produced).

**Session-relevant note:** none of the above are currently connected in this project's Claude Code session — the MCP servers available here today (Supabase, Gamma, Canva, Gmail, Slack) don't cover e-commerce scraping or Reddit. Firecrawl or Apify would be the natural additions when building the real ingestion pipeline in Phase 3.

---

## 6. Fit-Data Traceability & Current MCP Relevance

Added alongside the production-readiness build (auth, security, GDPR, analytics, fit data, explore page).

**Interview insight → feature mapping.** §1's most load-bearing finding is the "product implication" line: *"the recurring complaint isn't 'no tall option exists,' it's 'the tall option I found still isn't cut right.'"* Concretely — sleeve length ("3/4 sleeve length... made to be full length"), torso/rise ("all my height is in my waist"), and "flood pants." A "Tall" label on a product card doesn't address any of this; a real number does. That's the direct justification for the `inseam_cm`/`sleeve_cm`/`body_length_cm` fields added to `products` and surfaced on `ProductCard`, and for the min-inseam/min-sleeve filters on `/feed` and `/explore` — these are the feature-level answer to the complaint, not a generic e-commerce nicety. Coverage is currently low (this data isn't in any retailer feed — see the pull skill's notes) and should be treated as an ongoing curation task, not a one-time backfill.

**MCP servers now actually connected** (superseding §5's "none of the above are currently connected" note, which was true when written but no longer is): Firecrawl, Apify, SerpApi, Exa, and Playwright are all configured in `.mcp.json`. Relevance to this build specifically:
- **Firecrawl / Playwright MCP** — best fit for pulling fit measurements (task above): retailer size charts are usually rendered behind a JS modal, which a plain fetch (what `pull-shopify-products.mjs` does today) can't see but a real browser (Playwright) or a JS-aware crawler (Firecrawl) can.
- **Exa / SerpApi MCP** — best fit for finding more EU retailers (the EU-catalog gap from §3, now directly relevant to the region/shipping filters) via semantic or structured search rather than manual brand-by-brand guessing.
- **Apify MCP** — useful if a specific EU retailer needs a pre-built scraper Actor rather than the Shopify-feed trick (only works for Shopify-native stores, which most larger EU retailers are not).
