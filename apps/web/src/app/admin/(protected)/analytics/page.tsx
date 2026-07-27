import { adminPassword } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

function Bar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-40 shrink-0 truncate">{label}</span>
      <div className="h-2 flex-1 bg-line">
        <div className="h-2 bg-orange" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right font-mono text-xs text-muted">{count}</span>
    </div>
  );
}

interface ProductEventRow {
  signal_type: string;
  placement: string;
  created_at: string;
  product_name: string | null;
  retailer_name: string | null;
}

function tally<T>(items: T[], keyOf: (item: T) => string): [string, number][] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyOf(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export default async function AdminAnalytics() {
  const supabase = await createClient();
  const { data: events, error } = await supabase.rpc("admin_list_product_events", {
    p_password: adminPassword(),
  });

  if (error) {
    return <p className="text-sm text-red-600">Failed to load analytics: {error.message}</p>;
  }

  const clicks = ((events ?? []) as ProductEventRow[]).filter((e) => e.signal_type === "click");
  const byProduct = tally(clicks, (e) => e.product_name ?? "Unknown");
  const byRetailer = tally(clicks, (e) => e.retailer_name ?? "Unknown");
  const byPlacement = tally(clicks, (e) => e.placement);

  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const byDay = tally(clicks, (e) => e.created_at.slice(0, 10));
  const byDayMap = new Map(byDay);
  const dailyCounts = days.map((d) => byDayMap.get(d) ?? 0);
  const maxDaily = Math.max(1, ...dailyCounts);

  const maxProduct = Math.max(1, ...byProduct.map(([, c]) => c));
  const maxRetailer = Math.max(1, ...byRetailer.map(([, c]) => c));
  const maxPlacement = Math.max(1, ...byPlacement.map(([, c]) => c));

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.1em] text-muted">
          Clicks, last 14 days ({clicks.length} total)
        </h2>
        <div className="flex h-32 items-end gap-1">
          {dailyCounts.map((c, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full bg-orange"
                style={{ height: `${Math.max(2, (c / maxDaily) * 100)}%` }}
                title={`${days[i]}: ${c}`}
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.1em] text-muted">Clicks by product</h2>
        <div className="space-y-2">
          {byProduct.slice(0, 10).map(([name, count]) => (
            <Bar key={name} label={name} count={count} max={maxProduct} />
          ))}
          {byProduct.length === 0 && <p className="text-sm text-muted">No clicks logged yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.1em] text-muted">Clicks by retailer</h2>
        <div className="space-y-2">
          {byRetailer.map(([name, count]) => (
            <Bar key={name} label={name} count={count} max={maxRetailer} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.1em] text-muted">Clicks by placement</h2>
        <div className="space-y-2">
          {byPlacement.map(([name, count]) => (
            <Bar key={name} label={name} count={count} max={maxPlacement} />
          ))}
        </div>
      </section>
    </div>
  );
}
