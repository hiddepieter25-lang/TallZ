"use client";

import { useActionState } from "react";
import { changePasswordAction } from "./actions";
import { inputClasses } from "@/lib/ui-classes";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Change password</p>
      <input
        name="password"
        type="password"
        required
        minLength={8}
        placeholder="New password (min. 8 characters)"
        className={inputClasses}
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.done && <p className="text-sm text-green-700">Password updated.</p>}
      <button
        type="submit"
        disabled={pending}
        className="h-10 self-start border border-foreground px-5 font-mono text-xs uppercase tracking-[0.1em] transition-colors duration-150 ease-out hover:bg-foreground hover:text-background disabled:opacity-40"
      >
        {pending ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
