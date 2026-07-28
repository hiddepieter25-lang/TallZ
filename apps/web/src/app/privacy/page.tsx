export const metadata = {
  title: "Privacy Policy — TallZ",
};

export default function Privacy() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10">
      <p className="mb-8 border border-line bg-line/40 px-4 py-3 text-sm text-muted">
        <strong className="text-foreground">Draft, not legal advice.</strong>{" "}
        This is a starting-point privacy policy for early development. Have a
        lawyer review and adapt it before this app is used by real customers
        or launched publicly.
      </p>

      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-7">
        <section>
          <h2 className="text-base font-semibold">What we collect</h2>
          <p className="mt-2 text-muted">
            When you use our onboarding quiz, we collect the height range you
            select, your body proportions, style and fit preferences, and —
            only if you choose to add one — a photo you upload.{" "}
            <strong className="text-foreground">
              We treat your height as personal data
            </strong>{" "}
            and handle it with the same care as any other sensitive
            information you give us. You can create an account (email and
            password) to save your answers, but it&apos;s optional — the quiz
            and feed work fully without one.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Why we collect it</h2>
          <p className="mt-2 text-muted">
            We use your quiz answers to personalize the product feed you
            see — for example, showing more streetwear-tagged items if
            that&apos;s what you told us you like, or boosting items with
            extra leg length if you told us your height is mostly in your
            legs. We don&apos;t use this information for anything beyond
            running the app.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Where it&apos;s stored</h2>
          <p className="mt-2 text-muted">
            Your quiz answers, account details, and any uploaded photo are
            stored in our database, hosted by Supabase. We don&apos;t sell
            your information to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Links to other retailers</h2>
          <p className="mt-2 text-muted">
            Product cards link out to the retailer that actually sells the
            item — we don&apos;t process any purchases ourselves. Once you
            click through, you&apos;re on that retailer&apos;s site and
            subject to their own privacy policy. In the future, some of
            these links may be affiliate links, meaning we could earn a
            small commission if you buy something — this doesn&apos;t change
            the price you pay.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Cookies &amp; consent-based tracking</h2>
          <p className="mt-2 text-muted">
            When you first visit, we ask whether you&apos;re okay with us
            logging which products you view (and for roughly how long),
            which you click through to, save, or skip — including during
            the onboarding quiz — so we can improve recommendations over
            time. If you choose &quot;Essential only,&quot; outbound links
            still work exactly the same — we just don&apos;t log any of
            this. You can change this choice any time by clearing your
            browser&apos;s local storage for this site. We don&apos;t use
            third-party advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Children</h2>
          <p className="mt-2 text-muted">
            This app is not directed at children under 16, and we don&apos;t
            knowingly collect information from them.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Your choices &amp; deleting your data</h2>
          <p className="mt-2 text-muted">
            If you have an account, you can permanently delete your quiz
            answers, photo reference, and view/click/save history at any
            time from{" "}
            <span className="italic">Account → Delete my data</span>. If you
            used the app without an account and want a specific quiz
            submission removed, contact us using the details below and
            we&apos;ll take care of it.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Contact</h2>
          <p className="mt-2 text-muted">
            Questions about this policy? Reach us at{" "}
            <span className="italic">[add a real contact email here]</span>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Changes to this policy</h2>
          <p className="mt-2 text-muted">
            We may update this policy as the app changes. We&apos;ll update
            the &quot;last updated&quot; date above when we do.
          </p>
        </section>
      </div>
    </div>
  );
}
