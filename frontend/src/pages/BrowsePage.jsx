import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { MagnifyingGlass, FunnelSimple, X } from "@phosphor-icons/react";
import { http } from "@/api/client";
import GadgetCard from "@/components/GadgetCard";
import FilterSidebar from "@/components/FilterSidebar";

const SORTS = [
  { v: "featured", l: "Featured" },
  { v: "price_asc", l: "Price · Low to High" },
  { v: "price_desc", l: "Price · High to Low" },
  { v: "rating_desc", l: "Top Rated" },
  { v: "name_asc", l: "Name A→Z" },
];

export default function BrowsePage() {
  const [search, setSearch] = useSearchParams();
  const [meta, setMeta] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const filters = useMemo(
    () => ({
      q: search.get("q") || "",
      category: search.get("category") || "all",
      brand: search.get("brand") || "all",
      max_price: search.get("max_price") ? Number(search.get("max_price")) : undefined,
      sort: search.get("sort") || "featured",
    }),
    [search]
  );

  // load meta once
  useEffect(() => {
    http.get("/gadgets/meta").then(({ data }) => setMeta(data));
  }, []);

  // load gadgets when filters change
  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters.q) params.q = filters.q;
    if (filters.category && filters.category !== "all") params.category = filters.category;
    if (filters.brand && filters.brand !== "all") params.brand = filters.brand;
    if (filters.max_price) params.max_price = filters.max_price;
    if (filters.sort) params.sort = filters.sort;
    http
      .get("/gadgets", { params })
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }, [filters]);

  const updateFilters = (next) => {
    const sp = new URLSearchParams();
    if (next.q) sp.set("q", next.q);
    if (next.category && next.category !== "all") sp.set("category", next.category);
    if (next.brand && next.brand !== "all") sp.set("brand", next.brand);
    if (next.max_price && next.max_price !== meta?.price_max) sp.set("max_price", next.max_price);
    if (next.sort && next.sort !== "featured") sp.set("sort", next.sort);
    setSearch(sp);
  };

  return (
    <div data-testid="browse-page" className="pt-24 max-w-[1400px] mx-auto px-6 md:px-10 lg:px-14 pb-24">
      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-neon-cyan/80 font-mono">Catalog</div>
          <h1 className="mt-1 font-heading font-black text-4xl md:text-5xl tracking-tighter">
            Every gadget. <br /> One canvas.
          </h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 md:w-80">
            <MagnifyingGlass
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
            />
            <input
              data-testid="browse-search-input"
              type="text"
              placeholder="Search by name, brand…"
              value={filters.q}
              onChange={(e) => updateFilters({ ...filters, q: e.target.value })}
              className="input-neon pl-10"
            />
            {filters.q && (
              <button
                onClick={() => updateFilters({ ...filters, q: "" })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <select
            data-testid="browse-sort-select"
            value={filters.sort}
            onChange={(e) => updateFilters({ ...filters, sort: e.target.value })}
            className="input-neon !w-auto pr-8"
          >
            {SORTS.map((s) => (
              <option key={s.v} value={s.v} className="bg-surface-card">
                {s.l}
              </option>
            ))}
          </select>
          <button
            data-testid="browse-toggle-filters"
            onClick={() => setShowFilters((v) => !v)}
            className="md:hidden btn-ghost-neon py-3 px-4 text-xs flex items-center gap-2"
          >
            <FunnelSimple size={14} /> Filters
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-10">
        <div className={`${showFilters ? "block" : "hidden"} lg:block`}>
          {meta && <FilterSidebar meta={meta} filters={filters} onChange={updateFilters} />}
        </div>

        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="text-sm text-white/50 font-mono">
              {loading ? "Loading…" : `${items.length} result${items.length === 1 ? "" : "s"}`}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] rounded-2xl bg-surface-card border border-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div data-testid="browse-empty" className="card-gadget p-12 text-center">
              <h3 className="font-heading font-bold text-2xl">No gadgets match.</h3>
              <p className="text-sm text-white/50 mt-2">Try widening filters or clearing search.</p>
              <button
                onClick={() =>
                  updateFilters({ q: "", category: "all", brand: "all", max_price: meta?.price_max, sort: "featured" })
                }
                className="btn-ghost-neon mt-5 py-2 px-4 text-xs"
              >
                Reset all
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5" data-testid="browse-results">
              {items.map((g, i) => (
                <GadgetCard key={g.id} gadget={g} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
