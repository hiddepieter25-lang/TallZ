"use client";

import { useActionState } from "react";
import { requestResetAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/lib/ui-classes";

export default function ResetPassword() {
  const [state, formAction, pending] = useActionState(requestResetAction, {});

  if (state.sent) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-20 text-center sm:px-0">
        <h1 className="mb-3 text-2xl font-bold tracking-tight">check your email</h1>
        <p className="text-sm text-muted">
          If an account exists for that address, we&apos;ve sent a link to reset your password.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-20 sm:px-0">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-muted">Account</p>
      <h1 className="mb-2 text-3xl font-bold tracking-tight">reset password</h1>
      <p className="mb-8 text-sm text-muted">
        Enter your email and we&apos;ll send you a link to set a new password.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <input name="email" type="email" required placeholder="Email" className={inputClasses} />

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </div>
  );
}
