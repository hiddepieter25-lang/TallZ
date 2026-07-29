import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { NavLinks } from "@/components/NavLinks";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initial = user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-background">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-4 py-5 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center" aria-label="TallZ home">
          <Image src="/logo.png" alt="TallZ" width={641} height={315} className="h-9 w-auto" priority />
        </Link>
        <nav className="flex items-center gap-6 font-mono text-xs font-medium uppercase tracking-[0.12em]">
          <NavLinks loggedIn={!!user} initial={initial} />
        </nav>
        <form action="/search" method="get" className="hidden shrink-0 items-center rounded-full border border-foreground md:flex">
          <input
            name="q"
            type="text"
            placeholder="search"
            className="h-9 w-40 rounded-full bg-transparent px-4 font-mono text-xs placeholder:text-muted focus:outline-none lg:w-56"
          />
        </form>
      </div>
    </header>
  );
}
