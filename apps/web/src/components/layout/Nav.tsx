import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { NavLinks } from "@/components/layout/NavLinks";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initial = user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-background">
      <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-5 sm:gap-4 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center" aria-label="TallZ home">
          <Image
            src="/logo.png"
            alt="TallZ"
            width={641}
            height={315}
            className="h-7 w-auto sm:h-9"
            priority
          />
        </Link>

        <nav className="flex items-center font-mono text-xs font-medium uppercase tracking-[0.12em] sm:gap-1">
          <NavLinks />
        </nav>

        {/* Search and account sit together on the right, account furthest out. */}
        <form
          action="/search"
          method="get"
          className="ml-auto hidden shrink-0 items-center rounded-full border border-foreground md:flex"
        >
          <input
            name="q"
            type="text"
            placeholder="search"
            className="h-9 w-40 rounded-full bg-transparent px-4 font-mono text-xs placeholder:text-muted focus:outline-none lg:w-56"
          />
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.12em] md:ml-0">
          {user ? (
            <Link
              href="/account"
              aria-label="Account"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground bg-foreground text-[11px] font-semibold text-background transition-colors duration-150 ease-out hover:bg-background hover:text-foreground"
            >
              {initial}
            </Link>
          ) : (
            <>
              {/* Hidden on the smallest screens so the bar doesn't overflow —
                  the signup page carries its own "already have an account?"
                  link, so logging in stays one tap away. */}
              <Link
                href="/login"
                className="hidden rounded-full px-3 py-2 transition-colors duration-150 ease-out hover:text-accent sm:inline-flex"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="flex h-9 items-center rounded-full bg-foreground px-4 text-background transition-opacity duration-150 ease-out hover:opacity-80"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
