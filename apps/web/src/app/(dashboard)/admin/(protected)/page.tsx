import { adminPassword } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { getCatalogHealth } from "@/server/queries/products";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-line px-6 py-5">
      <p className="font-mono text-xs font-medium uppercase tracking-[0.1em] text-muted">{label}</p>
      <p className="mt-2 font-mono text-3xl font-medium tracking-tight">{value}</p>
    </div>
  );
}

export default async function AdminOverview() {
  const supabase = await createClient();

  const [health, feedbackResult, eventsResult] = await Promise.all([
    getCatalogHealth(),
    supabase.rpc("admin_list_feedback", { p_password: adminPassword() }),
    supabase.rpc("admin_list_product_events", { p_password: adminPassword() }),
  ]);

  const feedback = (feedbackResult.data ?? []) as { status: string }[];
  const events = (eventsResult.data ?? []) as { signal_type: string }[];
  const newFeedback = feedback.filter((f) => f.status === "new").length;
  const totalFeedback = feedback.length;
  const totalClicks = events.filter((e) => e.signal_type === "click").length;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard label="Products" value={health.totalProducts} />
      <StatCard label="With photos" value={health.productsWithPhotos} />
      <StatCard label="Outbound clicks" value={totalClicks} />
      <StatCard label="New feedback" value={`${newFeedback} / ${totalFeedback}`} />
    </div>
  );
}
