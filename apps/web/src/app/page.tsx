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
  "inline-flex h-10 items-center rounded-full border border-foreground px-4 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors duration-150 ease-out hover:bg-foreground hover:text-background";

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
        <div className="col-span-12 flex flex-col justify-center lg:col-span-6">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
            for women 173cm+ / men 183cm+
          </p>
          <h1
            className="mt-6 font-bold"
            style={{
              fontSize: "clamp(48px, 8vw, 108px)",
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
            }}
          >
            Your closet.
            <br />
            One tap
            <br />
            from yours.
          </h1>
          <p className="mt-8 max-w-[52ch] text-base leading-relaxed text-muted">
            Affordable tall-fit finds from {retailers.length} retailers, curated like a feed you'd
            actually want to scroll. Search, filter by inseam and sleeve, tap through, and check
            out on the seller's own site — TallZ just makes the match.
          </p>
        </div>
        <figure className="col-span-12 mt-12 lg:col-span-5 lg:col-start-8 lg:mt-0">
          <div
            className="relative flex aspect-[3/4] items-end overflow-hidden rounded-3xl p-6"
            style={{
              background:
                "radial-gradient(120% 90% at 20% 10%, rgba(255,255,255,0.22), transparent 55%), linear-gradient(160deg, #C9603B 0%, #8E3A2A 55%, #4A2018 100%)",
            }}
          >
            <span className="absolute left-6 top-6 rounded-full bg-card/90 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground">
              Algorithm pick
            </span>
            <h2
              className="font-bold uppercase text-card"
              style={{ fontSize: "clamp(28px, 3.2vw, 40px)", lineHeight: 0.95, letterSpacing: "-0.01em" }}
            >
              New drops,
              <br />
              your length.
            </h2>
          </div>
          <figcaption className="mt-3 font-mono text-xs text-muted">
            Curated for your height — updated as you scroll
          </figcaption>
        </figure>
      </section>

      {/* Search — 02 / search */}
      <section className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-8 sm:py-32" id="search">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">find your fit</p>
            <form action="/search" method="get" className="mt-6 flex overflow-hidden rounded-full border border-foreground">
              <input
                name="q"
                type="search"
                placeholder="Trousers, 36 inseam, black"
                aria-label="Search tall clothing"
                className={`${inputClasses} flex-1 rounded-none border-0`}
              />
              <button type="submit" className="rounded-none border-0 bg-accent px-8 font-mono text-xs font-medium uppercase tracking-[0.12em] text-white transition-colors duration-150 ease-out hover:opacity-85">
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
      <section className="bg-foreground py-24 text-background">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-12 gap-6 px-4 sm:px-8">
          <div className="col-span-12 lg:col-span-9">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-background/60">
              the fit problem
            </p>
            <h2
              className="mt-4 font-bold"
              style={{ fontSize: "clamp(28px, 4.5vw, 60px)", lineHeight: 1.05, letterSpacing: "-0.02em" }}
            >
              Cheap fashion shouldn&apos;t mean settling for a hem that stops an inch too soon.
            </h2>
          </div>
        </div>
      </section>

      {/* Products — 04 / new in tall */}
      <section className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-8 sm:py-32" id="new">
        <div className="flex items-end justify-between border-b border-line pb-5">
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-accent">new in tall</p>
            <h2 className="text-3xl font-bold tracking-tight">This week's edit</h2>
          </div>
          <Link href="/explore" className="font-mono text-xs uppercase tracking-[0.12em] hover:text-accent">
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
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-accent">build your closet</p>
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
