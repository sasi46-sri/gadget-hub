import { Link } from "react-router-dom";
import { X, Star, Heart } from "@phosphor-icons/react";
import { useCompare } from "@/context/CompareContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatPrice, categoryLabel } from "@/lib/format";
import { useMemo } from "react";

// Helpers to determine winner per spec
function parseNumber(value) {
  if (value == null) return null;
  const s = String(value);
  // Pull first number including decimals
  const match = s.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  return parseFloat(match[1].replace(",", ""));
}

// For most "more is better" specs (RAM, Storage, Battery, etc.) higher = better.
// For Weight it's lower-is-better. Default: higher wins. We auto-detect "Weight"-like keys.
const LOWER_IS_BETTER = ["weight"];

function detectWinners(items) {
  // Build union of spec keys (preserving order from first item)
  const keys = [];
  const seen = new Set();
  for (const it of items) {
    for (const k of Object.keys(it.specs || {})) {
      if (!seen.has(k)) {
        seen.add(k);
        keys.push(k);
      }
    }
  }
  const winners = {};
  for (const k of keys) {
    const lowerBetter = LOWER_IS_BETTER.some((w) => k.toLowerCase().includes(w));
    let best = null;
    let winnerIdx = -1;
    let allEqual = true;
    let firstNum = null;
    items.forEach((it, idx) => {
      const num = parseNumber(it.specs?.[k]);
      if (num == null) return;
      if (firstNum == null) firstNum = num;
      else if (num !== firstNum) allEqual = false;
      if (best == null) {
        best = num;
        winnerIdx = idx;
      } else if (lowerBetter ? num < best : num > best) {
        best = num;
        winnerIdx = idx;
      }
    });
    winners[k] = allEqual || winnerIdx === -1 ? -1 : winnerIdx;
  }
  return { keys, winners };
}

export default function ComparePage() {
  const { items, remove, clear } = useCompare();
  const { isWishlisted, toggle: toggleWish } = useWishlist();
  const { keys, winners } = useMemo(() => (items.length >= 2 ? detectWinners(items) : { keys: [], winners: {} }), [items]);
  const priceWinnerIdx = useMemo(() => {
    if (items.length < 2) return -1;
    let bestPrice = items[0].price;
    let idx = 0;
    items.forEach((it, i) => {
      if (it.price < bestPrice) {
        bestPrice = it.price;
        idx = i;
      }
    });
    const allEqual = items.every((it) => it.price === bestPrice);
    return allEqual ? -1 : idx;
  }, [items]);
  const ratingWinnerIdx = useMemo(() => {
    if (items.length < 2) return -1;
    let best = items[0].rating;
    let idx = 0;
    items.forEach((it, i) => {
      if (it.rating > best) {
        best = it.rating;
        idx = i;
      }
    });
    const allEqual = items.every((it) => it.rating === best);
    return allEqual ? -1 : idx;
  }, [items]);

  return (
    <div data-testid="compare-page" className="pt-24 max-w-[1400px] mx-auto px-6 md:px-10 lg:px-14 pb-20">
      <div className="flex items-end justify-between gap-6 flex-wrap mb-8">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-neon-cyan/80 font-mono">Spec Showdown</div>
          <h1 className="mt-1 font-heading font-black text-4xl md:text-5xl tracking-tighter">
            Compare. <span className="text-gradient">Decide.</span>
          </h1>
        </div>
        {items.length > 0 && (
          <button
            data-testid="compare-clear-btn"
            onClick={clear}
            className="text-xs uppercase tracking-[0.2em] text-white/50 hover:text-neon-magenta"
          >
            Clear all
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div data-testid="compare-empty" className="card-gadget p-12 text-center">
          <h3 className="font-heading font-bold text-2xl">No gadgets to compare yet.</h3>
          <p className="text-sm text-white/50 mt-2">Add up to 4 gadgets from the catalog or any product page.</p>
          <Link to="/browse" className="btn-neon mt-6 inline-block">
            Browse catalog
          </Link>
        </div>
      ) : items.length === 1 ? (
        <div data-testid="compare-need-more" className="card-gadget p-10 text-center">
          <h3 className="font-heading font-bold text-2xl">Add at least one more gadget.</h3>
          <p className="text-sm text-white/50 mt-2">You're comparing just one item — pick another to see the winners.</p>
          <Link to={`/browse?category=${items[0].category}`} className="btn-ghost-neon mt-6 inline-block">
            Find another {categoryLabel(items[0].category)}
          </Link>
          <div className="grid sm:grid-cols-2 mt-10 gap-5 max-w-md mx-auto">
            <CompareCard item={items[0]} onRemove={() => remove(items[0].id)} />
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6 md:-mx-10 lg:-mx-14 px-6 md:px-10 lg:px-14 scrollbar-thin">
          <div className="min-w-[760px]">
            {/* Headers */}
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `180px repeat(${items.length}, minmax(220px, 1fr))` }}
            >
              <div />
              {items.map((it) => (
                <CompareCard key={it.id} item={it} onRemove={() => remove(it.id)} />
              ))}
            </div>

            {/* Price row */}
            <CompareRow
              label="Price"
              cells={items.map((it, i) => (
                <span key={it.id} className={`font-mono ${priceWinnerIdx === i ? "winning-spec" : ""}`}>
                  <span>{formatPrice(it.price)}</span>
                </span>
              ))}
              count={items.length}
            />
            {/* Rating row */}
            <CompareRow
              label="Rating"
              cells={items.map((it, i) => (
                <span key={it.id} className={`font-mono inline-flex items-center gap-1 ${ratingWinnerIdx === i ? "winning-spec" : ""}`}>
                  <span><Star size={12} weight="fill" className="inline text-neon-yellow mr-1" />{it.rating.toFixed(1)}</span>
                </span>
              ))}
              count={items.length}
            />
            {/* Brand row */}
            <CompareRow
              label="Brand"
              cells={items.map((it) => (
                <span key={it.id} className="font-mono">{it.brand}</span>
              ))}
              count={items.length}
            />

            {/* Spec rows */}
            {keys.map((k) => (
              <CompareRow
                key={k}
                label={k}
                cells={items.map((it, i) => {
                  const value = it.specs?.[k] ?? "—";
                  const isWinner = winners[k] === i;
                  return (
                    <span key={it.id} className={`font-mono ${isWinner ? "winning-spec" : ""}`}>
                      <span>{value}</span>
                    </span>
                  );
                })}
                count={items.length}
              />
            ))}

            {/* Wishlist row */}
            <div
              className="grid gap-4 py-3 border-t border-white/10"
              style={{ gridTemplateColumns: `180px repeat(${items.length}, minmax(220px, 1fr))` }}
            >
              <div className="spec-label pt-2">Actions</div>
              {items.map((it) => {
                const wished = isWishlisted(it.id);
                return (
                  <div key={it.id}>
                    <button
                      data-testid={`compare-wishlist-${it.id}`}
                      onClick={() => toggleWish(it)}
                      className={`text-xs uppercase tracking-[0.18em] px-3 py-2 border ${
                        wished ? "border-neon-magenta text-neon-magenta" : "border-white/15 text-white/70 hover:border-neon-magenta hover:text-neon-magenta"
                      }`}
                    >
                      <Heart size={12} weight={wished ? "fill" : "bold"} className="inline mr-1.5" />
                      {wished ? "Wishlisted" : "Wishlist"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CompareCard({ item, onRemove }) {
  return (
    <div className="card-gadget p-4 relative" data-testid={`compare-card-${item.id}`}>
      <button
        data-testid={`compare-remove-${item.id}`}
        onClick={onRemove}
        className="absolute top-2 right-2 w-8 h-8 grid place-items-center rounded-full bg-black/60 border border-white/10 hover:border-neon-magenta hover:text-neon-magenta z-10"
        aria-label="Remove"
      >
        <X size={14} />
      </button>
      <div className="aspect-[4/3] bg-black rounded-md overflow-hidden mb-4">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-mono">{item.brand}</div>
      <Link to={`/gadgets/${item.id}`} className="font-heading font-bold text-base leading-tight hover:text-neon-cyan line-clamp-2">
        {item.name}
      </Link>
    </div>
  );
}

function CompareRow({ label, cells, count }) {
  return (
    <div
      className="grid gap-4 py-3 border-t border-white/10 items-center"
      style={{ gridTemplateColumns: `180px repeat(${count}, minmax(220px, 1fr))` }}
    >
      <div className="spec-label">{label}</div>
      {cells}
    </div>
  );
}
