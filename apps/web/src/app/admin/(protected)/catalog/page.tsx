import { adminPassword } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { updateProductAction } from "./actions";

const FITS = ["slim", "regular", "relaxed", "baggy"];
const GENDERS = ["men", "women", "unisex"];

interface ProductRow {
  id: string;
  name: string;
  retailer_name: string;
  category: string;
  fit: string;
  color: string | null;
  material: string | null;
  pattern: string | null;
  gender: string | null;
  price_cents: number;
  currency: string;
  active: boolean;
}

export default async function AdminCatalog({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; gender?: string; missing?: string }>;
}) {
  const { q, gender, missing } = await searchParams;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("admin_list_products", {
    p_password: adminPassword(),
  });

  let items = (data ?? []) as ProductRow[];
  if (q) items = items.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  if (gender) items = items.filter((p) => p.gender === gender);
  if (missing === "1") items = items.filter((p) => !p.color || !p.material || !p.pattern);

  return (
    <div>
      <form method="get" className="mb-6 flex flex-wrap items-center gap-4 font-mono text-xs">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name"
          className="border border-foreground bg-transparent px-2 py-1.5"
        />
        <select name="gender" defaultValue={gender ?? ""} className="border border-foreground bg-transparent px-2 py-1.5">
          <option value="">All genders</option>
          {GENDERS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" name="missing" value="1" defaultChecked={missing === "1"} />
          Missing color/material/pattern
        </label>
        <button
          type="submit"
          className="border border-foreground px-4 py-1.5 uppercase tracking-[0.1em] transition-colors duration-150 ease-out hover:bg-foreground hover:text-background"
        >
          Filter
        </button>
        <span className="ml-auto text-muted">{items.length} products</span>
      </form>

      {error && <p className="text-sm text-red-600">Failed to load products: {error.message}</p>}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-foreground text-left uppercase tracking-[0.08em] text-muted">
              <th className="py-2 pr-3">Name / Retailer</th>
              <th className="py-2 pr-3">Category</th>
              <th className="py-2 pr-3">Fit</th>
              <th className="py-2 pr-3">Color</th>
              <th className="py-2 pr-3">Material</th>
              <th className="py-2 pr-3">Pattern</th>
              <th className="py-2 pr-3">Gender</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b border-line align-top">
                <td className="max-w-[220px] py-3 pr-3">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-muted">{p.retailer_name}</p>
                </td>
                <td colSpan={7} className="py-3">
                  <form action={updateProductAction} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <input
                      type="text"
                      name="category"
                      defaultValue={p.category}
                      className="w-28 border border-foreground bg-transparent px-2 py-1"
                    />
                    <select name="fit" defaultValue={p.fit} className="border border-foreground bg-transparent px-2 py-1">
                      {FITS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      name="color"
                      defaultValue={p.color ?? ""}
                      placeholder="—"
                      className="w-24 border border-foreground bg-transparent px-2 py-1"
                    />
                    <input
                      type="text"
                      name="material"
                      defaultValue={p.material ?? ""}
                      placeholder="—"
                      className="w-24 border border-foreground bg-transparent px-2 py-1"
                    />
                    <input
                      type="text"
                      name="pattern"
                      defaultValue={p.pattern ?? ""}
                      placeholder="—"
                      className="w-24 border border-foreground bg-transparent px-2 py-1"
                    />
                    <select name="gender" defaultValue={p.gender ?? ""} className="border border-foreground bg-transparent px-2 py-1">
                      <option value="">—</option>
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="border border-foreground px-3 py-1 uppercase tracking-[0.1em] transition-colors duration-150 ease-out hover:bg-foreground hover:text-background"
                    >
                      Save
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="py-6 text-sm text-muted">No products match these filters.</p>}
      </div>
    </div>
  );
}
