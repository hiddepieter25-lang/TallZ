"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ACTIVE = "rounded-full bg-foreground px-4 py-2 text-background transition-colors duration-150 ease-out";
const INACTIVE = "rounded-full px-4 py-2 transition-colors duration-150 ease-out hover:text-accent";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link href={href} className={active ? ACTIVE : INACTIVE}>
      {children}
    </Link>
  );
}

export function NavLinks({ loggedIn, initial }: { loggedIn: boolean; initial: string }) {
  return (
    <>
      <NavLink href="/feed">Feed</NavLink>
      <NavLink href="/explore">Explore</NavLink>
      {loggedIn ? (
        <Link
          href="/account"
          aria-label="Account"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-foreground bg-foreground text-[11px] font-semibold text-background transition-colors duration-150 ease-out hover:bg-background hover:text-foreground"
        >
          {initial}
        </Link>
      ) : (
        <NavLink href="/login">Log in</NavLink>
      )}
    </>
  );
}
