"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Tighter horizontal padding on mobile — the bar has to fit logo, both browse
// links and the auth controls at 375px without overflowing.
const ACTIVE =
  "rounded-full bg-foreground px-2 py-2 text-background transition-colors duration-150 ease-out sm:px-4";
const INACTIVE =
  "rounded-full px-2 py-2 transition-colors duration-150 ease-out hover:text-accent sm:px-4";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link href={href} className={active ? ACTIVE : INACTIVE}>
      {children}
    </Link>
  );
}

/**
 * The browse destinations only — both are account-gated, so they redirect to
 * login when signed out. Sign-in/account controls live on the right-hand side
 * of the nav and are rendered server-side in Nav.tsx; this stays a client
 * component purely for the active-route highlight.
 */
export function NavLinks() {
  return (
    <>
      <NavLink href="/feed">Feed</NavLink>
      <NavLink href="/explore">Explore</NavLink>
    </>
  );
}
