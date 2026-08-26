"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession, adminPassword } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

async function setRetailerStatus(id: string, status: "approved" | "rejected") {
  await requireAdminSession();
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_retailer_status", {
    p_password: adminPassword(),
    p_id: id,
    p_status: status,
  });
  if (error) console.error(`Failed to set retailer status to ${status}:`, error.message);
  revalidatePath("/admin/retailers");
}

export async function approveRetailerAction(formData: FormData) {
  await setRetailerStatus(String(formData.get("id")), "approved");
}

export async function rejectRetailerAction(formData: FormData) {
  await setRetailerStatus(String(formData.get("id")), "rejected");
}
