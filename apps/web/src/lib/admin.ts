import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "tallz_admin_gate";
const ADMIN_PASSWORD = process.env.ADMIN_DASHBOARD_PASSWORD!;

/**
 * A signed token, not the password itself — the cookie can't be forged
 * without knowing the password, but doesn't expose it if the cookie leaks.
 * Also passed straight through as the RPC password argument server-side
 * (see admin_list_feedback etc. in Postgres), since the DB functions check
 * the real password independently — this app-level gate gets you into the
 * pages, the DB-level check is what actually protects the data.
 */
function signAdminToken(): string {
  return createHmac("sha256", ADMIN_PASSWORD).update("tallz-admin-gate").digest("hex");
}

export async function setAdminCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, signAdminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function hasAdminSession(): Promise<boolean> {
  const store = await cookies();
  const cookieValue = store.get(COOKIE_NAME)?.value;
  if (!cookieValue) return false;

  const expected = Buffer.from(signAdminToken());
  const actual = Buffer.from(cookieValue);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Use at the top of every /admin page. Redirects to the password form if not gated in. */
export async function requireAdminSession() {
  if (!(await hasAdminSession())) redirect("/admin/login");
}

/** Server-only — never sent to the client. Passed to the admin_* RPC functions, which verify it independently in Postgres. */
export function adminPassword() {
  return ADMIN_PASSWORD;
}

export function checkAdminPassword(candidate: string): boolean {
  const expected = Buffer.from(ADMIN_PASSWORD);
  const actual = Buffer.from(candidate);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
