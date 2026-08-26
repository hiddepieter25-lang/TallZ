import Link from "next/link";
import Image from "next/image";
import {
  diversifyByRetailer,
  getLatestOnboardingResponse,
  getProducts,
  getRetailerNames,
} from "@/server/queries/products";
import { ProductCard } from "@/components/features/products/ProductCard";
import { buttonClasses } from "@/components/ui/Button";
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

  // The quiz prompt is only for signed-in users who haven't answered yet —
  // once there's a saved response it disappears for good, and changing the
  // answers moves to /account.
  const savedAnswers = user ? await getLatestOnboardingResponse(supabase, user.id) : null;
  const showQuizPrompt = !!user && !savedAnswers;

  // The shop window for signed-out visitors, so it has to be actually new,
  // actually photographed, and varied — a placeholder swatch sells nothing,
  // and four near-identical items from one brand doesn't show the range.
  // Ingestion writes a whole retailer's batch with one timestamp, so "newest"
  // alone would return four items from whichever retailer synced last; taking
  // a recent window and round-robining across retailers fixes that.
  const RECENT_WINDOW = 24;
  const teaser = diversifyByRetailer(
    allProducts
      .filter((p) => p.imageUrl)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, RECENT_WINDOW)
  ).slice(0, 4);

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
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
            Affordable tall-fit finds from {retailers.length}{" "}
            retailers, curated like a feed you&apos;d actually want to scroll. Search, filter by
            inseam and sleeve, tap through, and check out on the seller&apos;s own site — TallZ
            just makes the match.
          </p>
        </div>
        <figure className="col-span-12 mt-12 lg:col-span-5 lg:col-start-8 lg:mt-0">
          {/* The logo mark, kept at its native 256px so it stays sharp — the
              card scales, the silhouette doesn't. Inverted because the source
              PNG is a black silhouette and this card is black. */}
          <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-3xl bg-foreground">
            {/* unoptimized on purpose: the optimizer was re-encoding this to
                128px, which the browser then upscaled back to 256 — a net
                quality loss. It's a 7KB two-tone PNG, so there's nothing to
                gain from optimizing it anyway. */}
            <Image
              src="/favicon-mark.png"
              alt=""
              width={256}
              height={256}
              priority
              unoptimized
              className="h-auto w-[62%] max-w-[256px] invert"
            />
            <span className="absolute inset-x-6 bottom-6 font-mono text-xs uppercase tracking-[0.12em] text-background/70">
              Cut long, worn well
            </span>
          </div>
        </figure>
      </section>

      {/* Search */}
      <section className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-8 sm:py-32" id="search">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">find your fit</p>
            <form
              action="/search"
              method="get"
              className="mt-6 flex overflow-hidden rounded-full border border-foreground"
            >
              <input
                name="q"
                type="search"
                placeholder="Trousers, 36 inseam, black"
                aria-label="Search tall clothing"
                className={`${inputClasses} flex-1 rounded-none border-0`}
              />
              <button
                type="submit"
                className="rounded-none border-0 bg-accent px-8 font-mono text-xs font-medium uppercase tracking-[0.12em] text-background transition-opacity duration-150 ease-out hover:opacity-80"
              >
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

      {/* Quiz prompt — signed in, not yet answered. Sits above the grid so it's
          the first thing a new account sees after the statement. */}
      {showQuizPrompt && (
        <section className="border-b border-line px-4 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto grid max-w-[1440px] grid-cols-12 items-center gap-6">
            <div className="col-span-12 lg:col-span-8">
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-muted">
                build your closet
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
                answer a few questions.
                <br />
                get a feed made for your height.
              </h2>
            </div>
            <div className="col-span-12 lg:col-span-4 lg:text-right">
              <Link href="/onboarding" className={`${buttonClasses.primary} w-fit lg:ml-auto`}>
                Get started
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Products */}
      <section className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-8 sm:py-32" id="new">
        <div className="flex items-end justify-between border-b border-line pb-5">
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-muted">just landed</p>
            <h2 className="text-3xl font-bold tracking-tight">The newest finds</h2>
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
    </div>
  );
}
