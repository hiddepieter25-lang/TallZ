/**
 * A plain GET form — no client JS needed. Submitting re-requests the page
 * with filter params added, preserving whatever other params (quiz answers)
 * were already on the URL via hidden inputs.
 */
export function CatalogFilterBar({
  preserveParams,
  euOnly,
  minInseam,
  minSleeve,
  categories,
  selectedCategory,
  colors,
  selectedColor,
  materials,
  selectedMaterial,
  selectedGender,
}: {
  preserveParams: Record<string, string | undefined>;
  euOnly?: boolean;
  minInseam?: string;
  minSleeve?: string;
  /** Explore-only — /feed has no category filter since the quiz already scopes taste. */
  categories?: string[];
  selectedCategory?: string;
  /** Only values actually present in the catalog — never a fabricated full list. */
  colors?: string[];
  selectedColor?: string;
  materials?: string[];
  selectedMaterial?: string;
  selectedGender?: string;
}) {
  return (
    <form
      method="get"
      className="mb-8 flex flex-wrap items-end gap-6 border border-line px-5 py-4 font-mono text-xs"
    >
      {Object.entries(preserveParams).map(
        ([key, value]) =>
          value && <input key={key} type="hidden" name={key} value={value} />
      )}

      {categories && (
        <label className="flex flex-col gap-1.5">
          <span className="font-medium uppercase tracking-[0.12em] text-muted">Category</span>
          <select
            name="category"
            defaultValue={selectedCategory ?? ""}
            className="border border-foreground bg-transparent px-2 py-1.5"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      )}

      {colors && colors.length > 0 && (
        <label className="flex flex-col gap-1.5">
          <span className="font-medium uppercase tracking-[0.12em] text-muted">Color</span>
          <select
            name="color"
            defaultValue={selectedColor ?? ""}
            className="border border-foreground bg-transparent px-2 py-1.5"
          >
            <option value="">All</option>
            {colors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      )}

      {materials && materials.length > 0 && (
        <label className="flex flex-col gap-1.5">
          <span className="font-medium uppercase tracking-[0.12em] text-muted">Material</span>
          <select
            name="material"
            defaultValue={selectedMaterial ?? ""}
            className="border border-foreground bg-transparent px-2 py-1.5"
          >
            <option value="">All</option>
            {materials.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="font-medium uppercase tracking-[0.12em] text-muted">Gender</span>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input type="radio" name="gender" value="" defaultChecked={!selectedGender} className="peer sr-only" />
            <span className="border border-foreground px-3 py-1.5 uppercase tracking-[0.08em] peer-checked:bg-foreground peer-checked:text-background">
              All
            </span>
          </label>
          {["men", "women", "unisex"].map((g) => (
            <label key={g} className="cursor-pointer">
              <input
                type="radio"
                name="gender"
                value={g}
                defaultChecked={selectedGender === g}
                className="peer sr-only"
              />
              <span className="border border-foreground px-3 py-1.5 uppercase tracking-[0.08em] peer-checked:bg-foreground peer-checked:text-background">
                {g}
              </span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer flex-col gap-1.5">
        <span className="font-medium uppercase tracking-[0.12em] text-muted">Region</span>
        <input type="checkbox" name="eu" value="1" defaultChecked={euOnly} className="peer sr-only" />
        <span className="border border-foreground px-3 py-1.5 uppercase tracking-[0.08em] peer-checked:bg-foreground peer-checked:text-background">
          EU retailers only
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-medium uppercase tracking-[0.12em] text-muted">Min inseam (cm)</span>
        <input
          type="number"
          name="minInseam"
          defaultValue={minInseam}
          placeholder="any"
          className="w-20 border border-foreground bg-transparent px-2 py-1.5"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-medium uppercase tracking-[0.12em] text-muted">Min sleeve (cm)</span>
        <input
          type="number"
          name="minSleeve"
          defaultValue={minSleeve}
          placeholder="any"
          className="w-20 border border-foreground bg-transparent px-2 py-1.5"
        />
      </label>

      <button
        type="submit"
        className="ml-auto h-9 border border-orange bg-orange px-6 font-medium uppercase tracking-[0.12em] text-white transition-colors duration-150 ease-out hover:bg-background hover:text-orange"
      >
        Apply
      </button>
    </form>
  );
}
