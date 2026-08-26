"use client";

import { useActionState } from "react";
import { submitFeedbackAction } from "@/server/actions/feedback";
import { Button } from "@/components/ui/Button";

const TYPES = [
  { id: "general", label: "General" },
  { id: "bug", label: "Something's broken" },
  { id: "suggestion", label: "Suggestion" },
  { id: "brand_request", label: "Add a brand" },
];

export default function Feedback() {
  const [state, formAction, pending] = useActionState(submitFeedbackAction, {});

  if (state.sent) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-20 text-center sm:px-0">
        <h1 className="mb-3 text-2xl font-bold tracking-tight">thanks.</h1>
        <p className="text-sm text-muted">We read every message — this genuinely helps.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-20 sm:px-0">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-muted">Contact</p>
      <h1 className="mb-2 text-3xl font-bold tracking-tight">feedback</h1>
      <p className="mb-8 text-sm text-muted">
        Found a bug, want a brand added, or have a suggestion? Tell us.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <select
          name="feedback_type"
          className="h-12 border border-foreground bg-transparent px-4 text-sm outline-none focus:border-accent"
        >
          {TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="What's on your mind?"
          className="border border-foreground bg-transparent px-4 py-3 text-sm outline-none focus:border-accent"
        />

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "Sending…" : "Send feedback"}
        </Button>
      </form>
    </div>
  );
}
