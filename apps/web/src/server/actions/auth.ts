"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { genericAuthMessage, logSecurityEvent, safeNext } from "@/lib/auth-errors";

export type SignInState = { error?: string };
export type SignUpState = { error?: string };
export type ResetRequestState = { sent?: boolean };

export async function signInAction(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
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

export async function signUpAction(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
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

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestResetAction(
  _prevState: ResetRequestState,
  formData: FormData
): Promise<ResetRequestState> {
  const email = String(formData.get("email") ?? "");
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password/confirm`,
  });
  logSecurityEvent("reset_requested", { email });

  // Always report success, whether or not the email exists — confirming
  // account existence via this form would be an information leak.
  return { sent: true };
}
