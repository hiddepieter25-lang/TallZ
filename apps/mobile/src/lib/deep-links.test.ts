import { describe, expect, it } from "vitest";
import { isRecovery, parseAuthLink } from "@/lib/deep-links";

describe("parseAuthLink", () => {
  it("reads a PKCE code from the query string", () => {
    expect(parseAuthLink("tallz://reset-password?code=abc123")).toEqual({
      kind: "code",
      code: "abc123",
      type: null,
    });
  });

  it("reads implicit tokens from the fragment", () => {
    const link = parseAuthLink(
      "tallz://reset-password#access_token=at&refresh_token=rt&type=recovery"
    );

    expect(link).toEqual({
      kind: "tokens",
      accessToken: "at",
      refreshToken: "rt",
      type: "recovery",
    });
  });

  it("prefers the fragment when a URL carries both", () => {
    // Supabase has sent a placeholder in the query and the real value in the
    // fragment; taking the query would sign the user in with the wrong token.
    const link = parseAuthLink(
      "tallz://reset-password?access_token=stale&refresh_token=stale#access_token=fresh&refresh_token=fresh"
    );

    expect(link).toMatchObject({ accessToken: "fresh", refreshToken: "fresh" });
  });

  it("surfaces an expired link as an error, not as nothing to do", () => {
    const link = parseAuthLink(
      "tallz://reset-password#error=access_denied&error_description=Email+link+is+invalid+or+has+expired"
    );

    expect(link).toEqual({
      kind: "error",
      message: "Email link is invalid or has expired",
    });
  });

  it("decodes percent escapes as well as plus signs", () => {
    const link = parseAuthLink("tallz://x#error_description=Token%20has%20expired");

    expect(link).toEqual({ kind: "error", message: "Token has expired" });
  });

  it("returns null for an ordinary deep link with nothing auth-related", () => {
    expect(parseAuthLink("tallz://explore")).toBeNull();
  });

  it("returns null when only half the token pair is present", () => {
    // Setting a session with a missing refresh token would fail later and more
    // confusingly than simply not recognising the link.
    expect(parseAuthLink("tallz://reset-password#access_token=at")).toBeNull();
  });

  it("survives a malformed escape rather than throwing", () => {
    expect(() => parseAuthLink("tallz://x?code=%E0%A4%A")).not.toThrow();
  });
});

describe("isRecovery", () => {
  it("is true only for a recovery link", () => {
    expect(isRecovery(parseAuthLink("tallz://x#access_token=a&refresh_token=b&type=recovery"))).toBe(
      true
    );
    expect(isRecovery(parseAuthLink("tallz://x#access_token=a&refresh_token=b&type=signup"))).toBe(
      false
    );
    expect(isRecovery(parseAuthLink("tallz://x?code=c"))).toBe(false);
    expect(isRecovery(null)).toBe(false);
  });

  it("is false for an error link, even one from a recovery mail", () => {
    expect(isRecovery(parseAuthLink("tallz://x#error=access_denied&type=recovery"))).toBe(false);
  });
});
