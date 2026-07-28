import { adminPassword } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

function Bar({ label, count, max, suffix = "" }: { label: string; count: number; max: number; suffix?: string }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-32 shrink-0 truncate font-mono text-xs uppercase tracking-[0.08em]">{label}</span>
      <div className="h-2 flex-1 bg-line">
        <div className="h-2 bg-orange" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-16 shrink-0 text-right font-mono text-xs text-muted">
        {count.toLocaleString()}
        {suffix}
      </span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-line px-6 py-5">
      <p className="font-mono text-xs font-medium uppercase tracking-[0.1em] text-muted">{label}</p>
      <p className="mt-2 font-mono text-3xl font-medium tracking-tight">{value}</p>
    </div>
  );
}

// Mirrors the scoring rules in apps/web/src/lib/products.ts (rankProducts/scoreOf) —
// this is a manually-maintained description of that logic for display, not the
// logic itself, so keep the two in sync if the weights ever change.
const SCORING_RULES: { label: string; detail: string; weight: string }[] = [
  { label: "Style tag match", detail: "Per style tag liked in the onboarding swipe deck", weight: "+2" },
  { label: "Occasion match", detail: "Per style tag implied by a chosen occasion", weight: "+1" },
  { label: "Proportion match", detail: "Category matches a stated long-leg/torso/arm proportion", weight: "+2" },
  { label: "Fit match", detail: "Product fit equals the stated fit preference", weight: "+2" },
  { label: "Budget match", detail: "Price falls inside the stated budget band", weight: "+1" },
];

interface AlgorithmOverview {
  total_events: number;
  total_users_with_signal: number;
  signal_counts: { signal_type: string; count: number }[];
  placement_counts: { placement: string; count: number }[];
  avg_dwell_by_placement: { placement: string; avg_dwell_ms: number }[];
  style_tag_counts: { tag: string; count: number }[];
}

export default async function AdminAlgorithm() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_algorithm_overview", {
    p_password: adminPassword(),
  });

  const overview = data as AlgorithmOverview | null;

  const signalCounts = overview?.signal_counts ?? [];
  const placementCounts = overview?.placement_counts ?? [];
  const dwellByPlacement = overview?.avg_dwell_by_placement ?? [];
  const tagCounts = overview?.style_tag_counts ?? [];

  const maxSignal = Math.max(1, ...signalCounts.map((s) => s.count));
  const maxPlacement = Math.max(1, ...placementCounts.map((p) => p.count));
  const maxDwell = Math.max(1, ...dwellByPlacement.map((d) => d.avg_dwell_ms));
  const maxTag = Math.max(1, ...tagCounts.map((t) => t.count));

  const saves = signalCounts.find((s) => s.signal_type === "save")?.count ?? 0;
  const ignores = signalCounts.find((s) => s.signal_type === "ignore")?.count ?? 0;
  const clicks = signalCounts.find((s) => s.signal_type === "click")?.count ?? 0;
  const impressions = signalCounts.find((s) => s.signal_type === "impression")?.count ?? 0;
  const decided = saves + ignores;
  const saveRate = decided > 0 ? `${Math.round((saves / decided) * 100)}%` : "—";
  const clickRate = impressions > 0 ? `${Math.round((clicks / impressions) * 100)}%` : "—";

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Discovery algorithm</h2>
        <p className="mt-1 text-sm text-muted">
          How the feed ranks products today, and what real usage signal it has to learn from.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">Failed to load: {error.message}</p>}

      <section>
        <h3 className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.1em] text-orange">
          01 / how ranking works today
        </h3>
        <div className="overflow-x-auto border border-line">
          <table className="w-full border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-line bg-line/30 text-left uppercase tracking-[0.08em] text-muted">
                <th className="px-4 py-2">Factor</th>
                <th className="px-4 py-2">When it applies</th>
                <th className="px-4 py-2 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {SCORING_RULES.map((rule) => (
                <tr key={rule.label} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{rule.label}</td>
                  <td className="px-4 py-3 text-muted">{rule.detail}</td>
                  <td className="px-4 py-3 text-right text-orange">{rule.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          Products are grouped into score tiers, highest first, then diversified so one retailer can&apos;t
          dominate a tier. No collaborative or embedding-based ranking runs yet — see the roadmap below.
        </p>
      </section>

      <section>
        <h3 className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.1em] text-orange">
          02 / engagement, all-time
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total signals" value={overview?.total_events ?? 0} />
          <StatCard label="Save rate" value={saveRate} />
          <StatCard label="Click-through rate" value={clickRate} />
          <StatCard label="Users with signal" value={overview?.total_users_with_signal ?? 0} />
        </div>
      </section>

      <section>
        <h3 className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.1em] text-orange">
          03 / signals by type
        </h3>
        <div className="space-y-2">
          {signalCounts.map((s) => (
            <Bar key={s.signal_type} label={s.signal_type} count={s.count} max={maxSignal} />
          ))}
          {signalCounts.length === 0 && <p className="text-sm text-muted">No signal logged yet.</p>}
        </div>
      </section>

      <section>
        <h3 className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.1em] text-orange">
          04 / signals by placement
        </h3>
        <div className="space-y-2">
          {placementCounts.map((p) => (
            <Bar key={p.placement} label={p.placement} count={p.count} max={maxPlacement} />
          ))}
          {placementCounts.length === 0 && <p className="text-sm text-muted">No signal logged yet.</p>}
        </div>
      </section>

      <section>
        <h3 className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.1em] text-orange">
          05 / average dwell time by placement
        </h3>
        <div className="space-y-2">
          {dwellByPlacement.map((d) => (
            <Bar key={d.placement} label={d.placement} count={d.avg_dwell_ms} max={maxDwell} suffix="ms" />
          ))}
          {dwellByPlacement.length === 0 && (
            <p className="text-sm text-muted">Not enough impression data yet — check back once /explore and /feed have real traffic.</p>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.1em] text-orange">
          06 / style taste signal (from saved products)
        </h3>
        <div className="space-y-2">
          {tagCounts.map((t) => (
            <Bar key={t.tag} label={t.tag} count={t.count} max={maxTag} />
          ))}
          {tagCounts.length === 0 && <p className="text-sm text-muted">No saves logged yet.</p>}
        </div>
      </section>
    </div>
  );
}
