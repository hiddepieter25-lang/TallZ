import Link from "next/link";
import { requireAdminSession } from "@/lib/admin";
import { adminLogoutAction } from "../actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession();

  return (
    <div className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-12 sm:px-8">
      <div className="mb-10 flex items-center gap-8 border-b border-foreground pb-4">
        <h1 className="text-xl font-bold tracking-tight">admin</h1>
        <nav className="flex gap-6 font-mono text-xs uppercase tracking-[0.1em]">
          <Link href="/admin" className="hover:text-accent">
            Overview
          </Link>
          <Link href="/admin/feedback" className="hover:text-accent">
            Feedback
          </Link>
          <Link href="/admin/catalog" className="hover:text-accent">
            Catalog
          </Link>
          <Link href="/admin/retailers" className="hover:text-accent">
            Retailers
          </Link>
          <Link href="/admin/analytics" className="hover:text-accent">
            Analytics
          </Link>
          <Link href="/admin/algorithm" className="hover:text-accent">
            Algorithm
          </Link>
        </nav>
        <form action={adminLogoutAction} className="ml-auto">
          <button type="submit" className="font-mono text-xs uppercase tracking-[0.1em] text-muted hover:text-foreground">
            Log out
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
