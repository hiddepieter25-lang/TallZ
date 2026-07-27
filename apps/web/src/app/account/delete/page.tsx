import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteAccountAction } from "./actions";

export default async function DeleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-20 sm:px-0">
      <h1 className="mb-3 text-2xl font-bold tracking-tight">delete your data</h1>
      <p className="mb-8 text-sm text-muted">
        This permanently deletes your quiz answers, uploaded photo reference,
        and click history. This can&apos;t be undone.
      </p>
      <form action={deleteAccountAction}>
        <button
          type="submit"
          className="h-12 w-full border border-red-600 bg-red-600 font-mono text-xs font-medium uppercase tracking-[0.12em] text-white transition-colors duration-150 ease-out hover:bg-background hover:text-red-600"
        >
          Permanently delete my data
        </button>
      </form>
    </div>
  );
}
