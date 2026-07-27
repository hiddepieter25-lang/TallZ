"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function adminLogoutAction() {
  const store = await cookies();
  // Must match the path the cookie was set with, or the browser won't clear it.
  store.set("tallz_admin_gate", "", { path: "/admin", maxAge: 0 });
  redirect("/admin/login");
}
