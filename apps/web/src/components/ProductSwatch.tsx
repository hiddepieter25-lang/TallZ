import { swatchColor } from "@/lib/products";

/**
 * Deterministic placeholder in place of a real product photo — no network
 * fetch, so it can never show the wrong (or a stranger's) image. Swap for
 * real photography once a product-data source is wired up.
 */
export function ProductSwatch({
  id,
  category,
  className,
}: {
  id: string;
  category: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center ${className ?? ""}`}
      style={{ backgroundColor: swatchColor(id) }}
    >
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-black/45">
        {category}
      </span>
    </div>
  );
}
