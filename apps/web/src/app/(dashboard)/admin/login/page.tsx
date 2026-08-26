"use client";

import { useActionState } from "react";
import { adminLoginAction } from "@/server/actions/admin-login";
import { inputClassesDark } from "@/lib/ui-classes";

export default function AdminLogin() {
  const [state, formAction, pending] = useActionState(adminLoginAction, {});

  return (
    <div className="flex flex-1 flex-col bg-foreground">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-20 text-background sm:px-0">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-background/60">Restricted</p>
        <h1 className="mb-8 text-3xl font-bold tracking-tight">admin</h1>

        <form action={formAction} className="flex flex-col gap-4">
          <input
            name="password"
            type="password"
            required
            autoFocus
            placeholder="Password"
            className={inputClassesDark}
          />

          {state.error && <p className="text-sm text-red-400">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 h-12 border border-background bg-background font-mono text-xs font-medium uppercase tracking-[0.12em] text-foreground transition-colors duration-150 ease-out hover:bg-foreground hover:text-background disabled:opacity-40"
          >
            {pending ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
