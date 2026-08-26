"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { genericAuthMessage } from "@/lib/auth-errors";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/lib/ui-classes";

export default function ConfirmResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmResetPassword />
    </Suspense>
  );
}

function ConfirmResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    const supabase = createClient();

    if (!code) {
      // Reading the URL and reacting to a missing code is the actual
      // one-time setup this effect exists to do, not a derivable render value.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("This reset link is invalid or has expired.");
      return;
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) setError("This reset link is invalid or has expired.");
      else setReady(true);
    });
  }, [searchParams]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      setError(genericAuthMessage(error.message));
      return;
    }
    router.push("/feed");
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-20 sm:px-0">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">set a new password</h1>

      {ready ? (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (min. 8 characters)"
            className={inputClasses}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? "Saving…" : "Save new password"}
          </Button>
        </form>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <p className="text-sm text-muted">Verifying your reset link…</p>
      )}
    </div>
  );
}
