"use server";

import { createClient as createServerClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function deleteAccountAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // These deletes run as the logged-in user, scoped by RLS policies that
  // only allow deleting your own rows — no elevated privileges needed.
  await supabase.from("product_events").delete().eq("user_id", user.id);
  await supabase.from("onboarding_responses").delete().eq("user_id", user.id);
  await supabase.from("profiles").delete().eq("user_id", user.id);

  // Fully removing the login itself (auth.users row) requires the Supabase
  // service role key, which isn't configured in this environment yet — see
  // NEXT_STEPS.md. When it is, this becomes a real admin.deleteUser() call;
  // until then we still remove all personal data and sign the user out.
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey) {
    const admin = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
    await admin.auth.admin.deleteUser(user.id);
  }

  await supabase.auth.signOut();
  redirect(serviceRoleKey ? "/account/deleted" : "/account/deleted?partial=1");
}
