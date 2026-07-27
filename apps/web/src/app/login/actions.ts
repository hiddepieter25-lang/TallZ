"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { genericAuthMessage, logSecurityEvent, safeNext } from "@/lib/auth-errors";

export type SignInState = { error?: string };

export async function signInAction(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""), "/feed");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    logSecurityEvent("login_failed", { email });
    return { error: genericAuthMessage(error.message) };
  }

  redirect(next);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
