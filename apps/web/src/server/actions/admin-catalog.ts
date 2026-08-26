"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession, adminPassword } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export async function updateProductAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_product", {
    p_password: adminPassword(),
    p_id: id,
    p_color: String(formData.get("color") ?? ""),
    p_material: String(formData.get("material") ?? ""),
    p_pattern: String(formData.get("pattern") ?? ""),
    p_gender: String(formData.get("gender") ?? ""),
    p_category: String(formData.get("category") ?? ""),
    p_fit: String(formData.get("fit") ?? ""),
  });
  if (error) console.error("Failed to update product:", error.message);
  revalidatePath("/admin/catalog");
  revalidatePath("/feed");
}
