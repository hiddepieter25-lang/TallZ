import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/login/actions";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function Account() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Faccount");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-20 sm:px-0">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-muted">Account</p>
      <h1 className="mb-8 text-3xl font-bold tracking-tight">your account</h1>

      <div className="mb-8 space-y-1">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Signed in as</p>
        <p className="text-sm">{user.email}</p>
      </div>

      <ChangePasswordForm />

      <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 font-mono text-xs uppercase tracking-[0.1em]">
        <Link href="/admin" className="hover:text-orange">
          Admin dashboard
        </Link>
        <Link href="/account/delete" className="text-red-600 hover:text-red-800">
          Delete my data
        </Link>
        <form action={signOutAction}>
          <button type="submit" className="text-muted hover:text-foreground">
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
