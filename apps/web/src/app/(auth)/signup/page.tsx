"use client";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signUpAction } from "@/server/actions/auth";
import { GoogleSignInButton } from "@/components/features/auth/GoogleSignInButton";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/lib/ui-classes";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <Signup />
    </Suspense>
  );
}

function Signup() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const [state, formAction, pending] = useActionState(signUpAction, {});

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-20 sm:px-0">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-muted">Account</p>
      <h1 className="mb-8 text-3xl font-bold tracking-tight">create an account</h1>

      <GoogleSignInButton next={next} />
      <div className="my-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.12em] text-muted">
        <div className="h-px flex-1 bg-line" />
        or
        <div className="h-px flex-1 bg-line" />
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <input name="email" type="email" required placeholder="Email" className={inputClasses} />
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Password (min. 8 characters)"
          className={inputClasses}
        />

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 font-mono text-xs uppercase tracking-[0.1em] text-muted">
        Already have an account?{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="text-foreground hover:text-accent">
          Log in
        </Link>
      </p>
    </div>
  );
}
