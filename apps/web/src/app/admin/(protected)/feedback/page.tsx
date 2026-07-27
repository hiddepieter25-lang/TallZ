import { adminPassword } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { updateFeedbackStatusAction } from "./actions";

const TYPES = ["general", "bug", "suggestion", "brand_request"];
const STATUSES = ["new", "reviewed", "resolved"];

interface FeedbackRow {
  id: string;
  feedback_type: string;
  message: string;
  status: string;
  created_at: string;
}

export default async function AdminFeedback({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>;
}) {
  const { type, status } = await searchParams;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("admin_list_feedback", {
    p_password: adminPassword(),
  });

  let items = (data ?? []) as FeedbackRow[];
  if (type) items = items.filter((f) => f.feedback_type === type);
  if (status) items = items.filter((f) => f.status === status);

  return (
    <div>
      <form method="get" className="mb-6 flex gap-4 font-mono text-xs">
        <select name="type" defaultValue={type ?? ""} className="border border-foreground bg-transparent px-2 py-1.5">
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} className="border border-foreground bg-transparent px-2 py-1.5">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="border border-foreground px-4 py-1.5 uppercase tracking-[0.1em] transition-colors duration-150 ease-out hover:bg-foreground hover:text-background">
          Filter
        </button>
      </form>

      {error && <p className="text-sm text-red-600">Failed to load feedback: {error.message}</p>}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="border border-line px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-xs font-medium uppercase tracking-[0.1em] text-muted">
                {item.feedback_type} · {new Date(item.created_at).toLocaleDateString()}
              </span>
              <form action={updateFeedbackStatusAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={item.id} />
                <select
                  name="status"
                  defaultValue={item.status}
                  className="border border-foreground bg-transparent px-2 py-1 font-mono text-xs"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="border border-foreground px-3 py-1 font-mono text-xs uppercase tracking-[0.1em] transition-colors duration-150 ease-out hover:bg-foreground hover:text-background"
                >
                  Save
                </button>
              </form>
            </div>
            <p className="mt-2 text-sm">{item.message}</p>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted">No feedback matches these filters.</p>}
      </div>
    </div>
  );
}
