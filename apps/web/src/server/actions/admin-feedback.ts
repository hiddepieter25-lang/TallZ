"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession, adminPassword } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export async function updateFeedbackStatusAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_feedback_status", {
    p_password: adminPassword(),
    p_id: id,
    p_status: status,
  });
  if (error) console.error("Failed to update feedback status:", error.message);
  revalidatePath("/admin/feedback");
}
