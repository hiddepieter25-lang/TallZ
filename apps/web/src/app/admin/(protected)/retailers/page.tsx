import { adminPassword } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { approveRetailerAction, rejectRetailerAction } from "./actions";

interface RetailerHealthRow {
  retailer_id: string;
  name: string;
  last_synced: string | null;
  product_count: number;
  photo_pct: number;
  complete_pct: number;
}

interface PendingRetailerRow {
  id: string;
  name: string;
  website_url: string;
  country: string | null;
  region: string | null;
  created_at: string;
}

export default async function AdminRetailers() {
  const supabase = await createClient();
  const [{ data: health, error: healthError }, { data: pending, error: pendingError }] = await Promise.all([
    supabase.rpc("admin_list_retailer_health", { p_password: adminPassword() }),
    supabase.rpc("admin_list_pending_retailers", { p_password: adminPassword() }),
  ]);

  const rows = (health ?? []) as RetailerHealthRow[];
  const pendingRows = (pending ?? []) as PendingRetailerRow[];

  return (
    <div>
      {pendingRows.length > 0 && (
        <div className="mb-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-bold tracking-tight">Pending retailers</h2>
            <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted">
              {pendingRows.length} awaiting review
            </span>
          </div>
          {pendingError && <p className="mb-4 text-sm text-red-600">Failed to load: {pendingError.message}</p>}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-foreground text-left uppercase tracking-[0.08em] text-muted">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Website</th>
                  <th className="py-2 pr-3">Country</th>
                  <th className="py-2 pr-3">Region</th>
                  <th className="py-2 pr-3">Found</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {pendingRows.map((r) => (
                  <tr key={r.id} className="border-b border-line">
                    <td className="py-3 pr-3 font-medium">{r.name}</td>
                    <td className="py-3 pr-3">
                      <a href={r.website_url} target="_blank" rel="noopener noreferrer" className="hover:text-orange">
                        {r.website_url}
                      </a>
                    </td>
                    <td className="py-3 pr-3">{r.country}</td>
                    <td className="py-3 pr-3">{r.region}</td>
                    <td className="py-3 pr-3 text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="py-3 pr-3">
                      <div className="flex gap-2">
                        <form action={approveRetailerAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <button
                            type="submit"
                            className="border border-orange bg-orange px-3 py-1 uppercase tracking-[0.1em] text-white transition-colors duration-150 ease-out hover:bg-background hover:text-orange"
                          >
                            Approve
                          </button>
                        </form>
                        <form action={rejectRetailerAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <button
                            type="submit"
                            className="border border-foreground px-3 py-1 uppercase tracking-[0.1em] transition-colors duration-150 ease-out hover:bg-foreground hover:text-background"
                          >
                            Reject
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-xl font-bold tracking-tight">Retailer health</h2>
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted">{rows.length} retailers</span>
      </div>

      {healthError && <p className="mb-4 text-sm text-red-600">Failed to load: {healthError.message}</p>}

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
