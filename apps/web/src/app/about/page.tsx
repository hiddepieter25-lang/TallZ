import Link from "next/link";

export const metadata = {
  title: "About — TallZ",
};

export default function About() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        Fashion, in your size.
      </h1>

      <div className="mt-10 space-y-8 text-sm leading-7">
        <section>
          <h2 className="text-base font-semibold">Who we are</h2>
          <p className="mt-2 text-muted">
            TallZ is a small, independent project built for tall people —
            women 173cm+ and men 183cm+ — who are tired of clothes that
            almost fit.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Why we built this</h2>
          <p className="mt-2 text-muted">
            Suitable tall-fit clothing exists — it&apos;s just scattered
            across dozens of brands and retailers, each with their own tall
            sections, sizing systems, and inconsistent cuts. Sleeves that
            stop short, trousers that ride up, jackets cut for a shorter
            torso — the problem was never a lack of options, it was
            discovery. Finding the right pieces takes hours of digging
            through brand after brand.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">What we do</h2>
          <p className="mt-2 text-muted">
            We pull together tall-fit clothing from retailers around the
            world into one feed, and personalize it to how your height
            actually shows up — whether that&apos;s mostly in your legs,
            torso, or arms — plus your style, the occasions you shop for,
            and your budget. Where we have it, we show real fit
            measurements on each item instead of just a &quot;tall&quot;
            label.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">How we use your data</h2>
          <p className="mt-2 text-muted">
            We collect what&apos;s needed to personalize your feed — your
            height, style preferences, and (only with your consent) which
            products you click through to. Full details are in our{" "}
            <Link href="/privacy" className="text-foreground underline">
              Privacy Policy
            </Link>
            , including how to delete your data at any time.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Get in touch</h2>
          <p className="mt-2 text-muted">
            Found a bug, want a brand added, or just have thoughts?{" "}
            <Link href="/feedback" className="text-foreground underline">
              Send us feedback
            </Link>{" "}
            — we read every message.
          </p>
        </section>
      </div>
    </div>
  );
}
