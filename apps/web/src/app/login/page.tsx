"use client";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signInAction } from "./actions";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { inputClassesDark } from "@/lib/ui-classes";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
}

function Login() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const [state, formAction, pending] = useActionState(signInAction, {});

  return (
    <div className="flex flex-1 flex-col bg-foreground">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-20 text-background sm:px-0">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-background/60">Account</p>
        <h1 className="mb-8 text-3xl font-bold tracking-tight">log in</h1>

        <GoogleSignInButton next={next} dark />
        <div className="my-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.12em] text-background/60">
          <div className="h-px flex-1 bg-background/20" />
          or
          <div className="h-px flex-1 bg-background/20" />
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="next" value={next} />
          <input name="email" type="email" required placeholder="Email" className={inputClassesDark} />
          <input name="password" type="password" required placeholder="Password" className={inputClassesDark} />

          {state.error && <p className="text-sm text-red-400">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 h-12 w-full border border-background bg-background font-mono text-xs font-medium uppercase tracking-[0.12em] text-foreground transition-colors duration-150 ease-out hover:bg-foreground hover:text-background disabled:opacity-40"
          >
            {pending ? "Logging in…" : "Log in"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between font-mono text-xs uppercase tracking-[0.1em] text-background/70">
          <Link href="/reset-password" className="hover:text-orange">
            Forgot password?
          </Link>
          <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="hover:text-orange">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
