"use server";

import { createClient } from "@/lib/supabase/server";

export type FeedbackState = { sent?: boolean; error?: string };

export async function submitFeedbackAction(_prevState: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const feedbackType = String(formData.get("feedback_type") ?? "general");
  const message = String(formData.get("message") ?? "").trim();

  if (!message) return { error: "Please write a message before submitting." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("feedback").insert({
    feedback_type: feedbackType,
    message,
    user_id: user?.id ?? null,
  });

  if (error) {
    console.error("Failed to save feedback:", error.message);
    return { error: "Something went wrong. Please try again." };
  }

  return { sent: true };
}
