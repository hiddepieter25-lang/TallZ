// Maps Supabase Auth errors to short, generic messages so raw provider
// text (which can vary by internal implementation detail) never reaches
// the UI. Falls back to one generic message for anything unrecognized.
export function genericAuthMessage(errorMessage: string): string {
  const m = errorMessage.toLowerCase();
  if (m.includes("invalid login credentials")) return "Incorrect email or password.";
  if (m.includes("email not confirmed")) return "Please confirm your email before logging in — check your inbox.";
  if (m.includes("already registered") || m.includes("already exists")) {
    return "An account with this email already exists.";
  }
  if (m.includes("password") && m.includes("least")) {
    return "Password is too short.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (m.includes("email") && m.includes("valid")) return "Please enter a valid email address.";
  return "Something went wrong. Please try again.";
}

// Only allow same-site relative paths for post-login redirects — an
// unvalidated "next" param would otherwise be an open-redirect vector.
export function safeNext(next: string | null | undefined, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

// Server-side only. Never pass the password or full quiz answers here —
// this is a lightweight audit trail, not a place to dump request bodies.
export function logSecurityEvent(kind: "login_failed" | "signup_failed" | "reset_requested", detail: { email?: string }) {
  console.error(`[security] ${kind}`, {
    email: detail.email ? detail.email.replace(/(?<=.).(?=[^@]*@)/g, "*") : undefined,
    at: new Date().toISOString(),
  });
}
