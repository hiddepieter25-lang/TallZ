"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { logSecurityEvent } from "@/lib/auth-errors";

export type ResetRequestState = { sent?: boolean };

/**
 * The only auth action left on the web. Signing in and signing up moved to the
 * mobile app; password reset stayed because the reset link Supabase mails out
 * has to open somewhere, and an app can't receive a plain https link yet.
 */
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
