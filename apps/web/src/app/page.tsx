import Link from "next/link";
import { getProducts, getRetailerNames } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { buttonClasses } from "@/components/Button";
import { inputClasses } from "@/lib/ui-classes";
import { createClient } from "@/lib/supabase/server";

const INSEAM_CHIPS = [
  { label: "34\" inseam", href: "/feed?minInseam=86" },
  { label: "36\" inseam", href: "/feed?minInseam=91" },
  { label: "38\" inseam", href: "/feed?minInseam=97" },
  { label: "Long sleeve 37\"", href: "/feed?minSleeve=94" },
  { label: "Tall torso", href: "/feed?proportion=long_torso" },
];

const chipClasses =
  "inline-flex h-10 items-center border border-foreground px-4 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors duration-150 ease-out hover:bg-foreground hover:text-background";

export default async function Home() {
  const supabase = await createClient();
  const [
    { data: { user } },
    allProducts,
    retailers,
  ] = await Promise.all([supabase.auth.getUser(), getProducts(), getRetailerNames()]);
  const onboardingHref = user ? "/onboarding" : "/login?next=%2Fonboarding";
  // Lead with products that have real ingested photos (currently the
  // Shopify-sourced retailers — see MARKET_RESEARCH.md §4) so the landing
  // page shows off real data rather than placeholders where possible.
  const teaser = [...allProducts]
    .sort((a, b) => Number(!!b.imageUrl) - Number(!!a.imageUrl))
    .slice(0, 4);

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero — 01 / index */}
      <section className="mx-auto grid w-full max-w-[1440px] grid-cols-12 gap-6 px-4 pb-20 pt-16 sm:px-8 sm:pt-24">
        <div className="col-span-12 lg:col-span-6">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
            01 / index — for women 173cm+ / men 183cm+
          </p>
          <h1
            className="mt-6 font-bold"
            style={{
              fontSize: "clamp(64px, 11vw, 180px)",
              lineHeight: 0.88,
              letterSpacing: "-0.04em",
            }}
          >
            Clothes
            <br />
            that end
            <br />
            where you
            <br />
            do.
          </h1>
          <p className="mt-10 max-w-[65ch] text-base leading-relaxed">
            Every tall-fit garment from {retailers.length} retailers, in one search. Filter by
            inseam, sleeve and torso length before you filter by anything else.
          </p>
        </div>
        <figure className="col-span-12 mt-12 lg:col-span-5 lg:col-start-8 lg:mt-0">
          <div className="flex aspect-[3/4] items-end bg-foreground p-6">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-background">
              Editorial 01 — full silhouette
            </p>
          </div>
          <figcaption className="mt-3 font-mono text-xs text-muted">
            Hero image slot — high-contrast b/w, full body, 3:4
          </figcaption>
        </figure>
      </section>

      {/* Search — 02 / search */}
      <section className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-8 sm:py-32" id="search">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">02 / search</p>
            <form action="/search" method="get" className="mt-6 flex">
              <input
                name="q"
                type="search"
                placeholder="Trousers, 36 inseam, black"
                aria-label="Search tall clothing"
                className={`${inputClasses} flex-1 border-r-0`}
              />
              <button type="submit" className={buttonClasses.primary}>
                Search
              </button>
            </form>
            <div className="mt-6 flex flex-wrap gap-2">
              {INSEAM_CHIPS.map((chip) => (
                <Link key={chip.label} href={chip.href} className={chipClasses}>
                  {chip.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Statement — the one full-bleed block per DESIGN.md */}
      <section className="bg-orange py-24 text-white">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-12 gap-6 px-4 sm:px-8">
          <div className="col-span-12 lg:col-span-9">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-white/75">
              03 / the problem
            </p>
            <h2
              className="mt-4 font-bold"
              style={{ fontSize: "clamp(32px, 5vw, 72px)", lineHeight: 0.95, letterSpacing: "-0.03em" }}
            >
              Standard sizing stops at 34. Most of us don&apos;t.
            </h2>
          </div>
        </div>
      </section>

      {/* Products — 04 / new in tall */}
      <section className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-8 sm:py-32" id="new">
        <div className="flex items-end justify-between border-b border-line pb-5">
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-orange">04 / new in tall</p>
            <h2 className="text-3xl font-bold tracking-tight">New in tall</h2>
          </div>
          <Link href="/explore" className="font-mono text-xs uppercase tracking-[0.12em] hover:text-orange">
            View all
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
          {teaser.map((product) => (
            <ProductCard key={product.id} product={product} priority />
          ))}
        </div>
      </section>

      {/* Quiz — secondary path to the personalized feed */}
      <section className="border-t border-line px-4 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-[1440px] grid-cols-12 items-center gap-6">
          <div className="col-span-12 lg:col-span-8">
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-orange">05 / quiz</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
              answer a few questions.
              <br />
              get a feed made for your height.
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:text-right">
            <Link href={onboardingHref} className={`${buttonClasses.primary} w-fit lg:ml-auto`}>
              Get started
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
