import { categoryLabel } from "@/lib/format";

export default function FilterSidebar({ meta, filters, onChange }) {
  const update = (patch) => onChange({ ...filters, ...patch });

  return (
    <aside data-testid="filter-sidebar" className="space-y-7">
      {/* Category */}
      <div>
        <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-3 font-mono">Category</h4>
        <div className="space-y-1.5">
          <FilterRadio
            id="cat-all"
            label="All gadgets"
            checked={!filters.category || filters.category === "all"}
            onChange={() => update({ category: "all" })}
          />
          {meta?.categories?.map((c) => (
            <FilterRadio
              key={c}
              id={`cat-${c}`}
              label={categoryLabel(c)}
              checked={filters.category === c}
              onChange={() => update({ category: c })}
            />
          ))}
        </div>
      </div>

      {/* Brand */}
      <div>
        <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-3 font-mono">Brand</h4>
        <div className="max-h-56 overflow-y-auto pr-2 scrollbar-thin space-y-1.5">
          <FilterRadio
            id="brand-all"
            label="All brands"
            checked={!filters.brand || filters.brand === "all"}
            onChange={() => update({ brand: "all" })}
          />
          {meta?.brands?.map((b) => (
            <FilterRadio
              key={b}
              id={`brand-${b}`}
              label={b}
              checked={filters.brand === b}
              onChange={() => update({ brand: b })}
            />
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-3 font-mono">
          Max Price ₹{(filters.max_price || meta?.price_max || 0).toLocaleString("en-IN")}
        </h4>
        <input
          data-testid="filter-price-range"
          type="range"
          min={meta?.price_min || 0}
          max={meta?.price_max || 400000}
          step={1000}
          value={filters.max_price ?? meta?.price_max ?? 400000}
          onChange={(e) => update({ max_price: Number(e.target.value) })}
          className="w-full accent-[#00f0ff]"
        />
        <div className="flex justify-between text-[10px] uppercase tracking-[0.18em] text-white/40 mt-1 font-mono">
          <span>₹{(meta?.price_min || 0).toLocaleString("en-IN")}</span>
          <span>₹{(meta?.price_max || 0).toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Reset */}
      <button
        data-testid="filter-reset-btn"
        onClick={() =>
          onChange({ category: "all", brand: "all", max_price: meta?.price_max, q: filters.q || "", sort: "featured" })
        }
        className="w-full btn-ghost-neon py-2 text-xs"
      >
        Reset filters
      </button>
    </aside>
  );
}

function FilterRadio({ id, label, checked, onChange }) {
  return (
    <label
      htmlFor={id}
      data-testid={id}
      className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition border ${
        checked
          ? "bg-neon-cyan/5 border-neon-cyan/40 text-neon-cyan"
          : "border-transparent text-white/70 hover:bg-white/5"
      }`}
    >
      <input id={id} type="radio" checked={checked} onChange={onChange} className="sr-only" />
      <span className={`w-2 h-2 rounded-full ${checked ? "bg-neon-cyan shadow-[0_0_8px_#00f0ff]" : "bg-white/20"}`} />
      <span className="text-sm">{label}</span>
    </label>
  );
}
