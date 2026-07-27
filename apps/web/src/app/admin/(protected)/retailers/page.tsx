import { createClient } from "@/lib/supabase/server";

interface RetailerRow {
  id: string;
  name: string;
}

interface ProductRow {
  id: string;
  retailer_id: string;
  color: string | null;
  material: string | null;
  pattern: string | null;
  product_images: { id: string }[];
}

interface RetailerHealth {
  id: string;
  name: string;
  productCount: number;
  photoPct: number;
  completePct: number;
}

// `retailers`/`products`/`product_images` all have public-read RLS policies
// (same ones the live site itself relies on), so this page computes health
// from a direct query — no admin RPC needed for these three columns.
// "Last synced" would need to read `ingestion_jobs`, which has no public
// policy; that column is a follow-up once the admin_list_retailer_health
// database function can be applied (see chat — currently blocked pending
// approval of that database change).
export default async function AdminRetailers() {
  const supabase = await createClient();

  const [{ data: retailers, error: retailersError }, { data: products, error: productsError }] =
    await Promise.all([
      supabase.from("retailers").select("id, name").order("name"),
      supabase
        .from("products")
        .select("id, retailer_id, color, material, pattern, product_images(id)")
        .eq("active", true),
    ]);

  const rows: RetailerRow[] = retailers ?? [];
  const allProducts: ProductRow[] = (products ?? []) as ProductRow[];

  const health: RetailerHealth[] = rows.map((r) => {
    const forRetailer = allProducts.filter((p) => p.retailer_id === r.id);
    const count = forRetailer.length;
    const withPhoto = forRetailer.filter((p) => p.product_images.length > 0).length;
    const complete = forRetailer.filter((p) => p.color && p.material && p.pattern).length;
    return {
      id: r.id,
      name: r.name,
      productCount: count,
      photoPct: count ? Math.round((withPhoto / count) * 100) : 0,
      completePct: count ? Math.round((complete / count) * 100) : 0,
    };
  });

  const error = retailersError || productsError;

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
            {health.map((r) => (
              <tr key={r.id} className="border-b border-line">
                <td className="py-3 pr-3 font-medium">{r.name}</td>
                <td className="py-3 pr-3">{r.productCount}</td>
                <td className="py-3 pr-3">{r.photoPct}%</td>
                <td className="py-3 pr-3">{r.completePct}%</td>
                <td className="py-3 pr-3 text-muted">not available yet</td>
              </tr>
            ))}
          </tbody>
        </table>
        {health.length === 0 && <p className="py-6 text-sm text-muted">No retailers yet.</p>}
      </div>
    </div>
  );
}
