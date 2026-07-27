"use server";

import { createClient } from "@/lib/supabase/server";
import { genericAuthMessage } from "@/lib/auth-errors";

export type ChangePasswordState = { error?: string; done?: boolean };

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: genericAuthMessage(error.message) };

  return { done: true };
}
