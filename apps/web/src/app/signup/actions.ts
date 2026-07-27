"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { genericAuthMessage, logSecurityEvent, safeNext } from "@/lib/auth-errors";

export type SignUpState = { error?: string };

export async function signUpAction(_prevState: SignUpState, formData: FormData): Promise<SignUpState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""), "/feed");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });

  if (error) {
    logSecurityEvent("signup_failed", { email });
    return { error: genericAuthMessage(error.message) };
  }

  // If email confirmation is off in the Supabase project, signUp already
  // returns an active session — no need to make the user wait on an email.
  redirect(data.session ? next : "/signup/check-email");
}
