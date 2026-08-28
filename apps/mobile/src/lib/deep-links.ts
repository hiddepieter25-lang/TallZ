/**
 * Parsing for the links Supabase mails out (signup confirmation, password
 * recovery). Kept separate from the code that acts on them so it can be tested
 * without a Supabase client or a device.
 *
 * Supabase does not use one consistent shape, so all three are handled:
 *   tallz://reset-password?code=abc                        (PKCE)
 *   tallz://reset-password#access_token=…&refresh_token=…  (implicit)
 *   tallz://reset-password#error=access_denied&…           (expired or reused)
 *
 * Values arrive in the query string, the fragment, or both, which is why this
 * reads both rather than assuming one.
 */

export type AuthLink =
  | { kind: "code"; code: string; type: string | null }
  | { kind: "tokens"; accessToken: string; refreshToken: string; type: string | null }
  | { kind: "error"; message: string }
  | null;

function paramsFrom(part: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of part.split("&")) {
    if (!pair) continue;
    const eq = pair.indexOf("=");
    const rawKey = eq < 0 ? pair : pair.slice(0, eq);
    const rawValue = eq < 0 ? "" : pair.slice(eq + 1);
    try {
      // "+" is a space in form encoding; decodeURIComponent does not know that.
      out[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue.replace(/\+/g, " "));
    } catch {
      // A malformed escape shouldn't lose the rest of the link.
      out[rawKey] = rawValue;
    }
  }
  return out;
}

/** null when the URL carries nothing auth-related — an ordinary deep link. */
export function parseAuthLink(url: string): AuthLink {
  const hash = url.indexOf("#");
  const fragment = hash >= 0 ? url.slice(hash + 1) : "";
  const beforeHash = hash >= 0 ? url.slice(0, hash) : url;
  const question = beforeHash.indexOf("?");
  const query = question >= 0 ? beforeHash.slice(question + 1) : "";

  // Fragment wins: when Supabase sends both, the fragment holds the real tokens.
  const params = { ...paramsFrom(query), ...paramsFrom(fragment) };

  if (params.error || params.error_code || params.error_description) {
    return { kind: "error", message: params.error_description || params.error || "Link is invalid." };
  }

  const type = params.type ?? null;

  if (params.access_token && params.refresh_token) {
    return {
      kind: "tokens",
      accessToken: params.access_token,
      refreshToken: params.refresh_token,
      type,
    };
  }

  if (params.code) return { kind: "code", code: params.code, type };

  return null;
}

/** True for a password-recovery link, which has to land on the new-password screen. */
export function isRecovery(link: AuthLink): boolean {
  return link !== null && link.kind !== "error" && link.type === "recovery";
}
