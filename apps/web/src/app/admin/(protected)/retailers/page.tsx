import { adminPassword } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

interface RetailerHealthRow {
  retailer_id: string;
  name: string;
  last_synced: string | null;
  product_count: number;
  photo_pct: number;
  complete_pct: number;
}

export default async function AdminRetailers() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_retailer_health", {
    p_password: adminPassword(),
  });

  const rows = (data ?? []) as RetailerHealthRow[];

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-xl font-bold tracking-tight">Retailer health</h2>
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted">{rows.length} retailers</span>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">Failed to load: {error.message}</p>}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-foreground text-left uppercase tracking-[0.08em] text-muted">
              <th className="py-2 pr-3">Retailer</th>
              <th className="py-2 pr-3">Products</th>
              <th className="py-2 pr-3">With photo</th>
              <th className="py-2 pr-3">Color/material/pattern filled</th>
              <th className="py-2 pr-3">Last synced</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.retailer_id} className="border-b border-line">
                <td className="py-3 pr-3 font-medium">{r.name}</td>
                <td className="py-3 pr-3">{r.product_count}</td>
                <td className="py-3 pr-3">{r.photo_pct}%</td>
                <td className="py-3 pr-3">{r.complete_pct}%</td>
                <td className="py-3 pr-3 text-muted">
                  {r.last_synced ? new Date(r.last_synced).toLocaleString() : "never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="py-6 text-sm text-muted">No retailers yet.</p>}
      </div>
    </div>
  );
}
