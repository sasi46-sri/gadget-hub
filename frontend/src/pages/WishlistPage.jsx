import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "@phosphor-icons/react";
import { http } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import GadgetCard from "@/components/GadgetCard";

export default function WishlistPage() {
  const { user } = useAuth();
  const { ids } = useWishlist();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (user) {
          const { data } = await http.get("/wishlist");
          setItems(data);
        } else if (ids.length) {
          // Fetch each id (use compare endpoint to batch)
          const { data } = await http.post("/gadgets/compare", { gadget_ids: ids.slice(0, 4) });
          // For full local list >4, we batch all via repeated calls (cap at 4 due to API)
          if (ids.length > 4) {
            // Fall back: load all & filter client side
            const all = await http.get("/gadgets");
            setItems(all.data.filter((g) => ids.includes(g.id)));
          } else {
            setItems(data);
          }
        } else {
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, ids]);

  return (
    <div data-testid="wishlist-page" className="pt-24 max-w-[1400px] mx-auto px-6 md:px-10 lg:px-14 pb-20">
      <div className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.3em] text-neon-magenta/80 font-mono">Saved by you</div>
        <h1 className="mt-1 font-heading font-black text-4xl md:text-5xl tracking-tighter">
          Your <span className="text-gradient">wishlist</span>.
        </h1>
        {!user && (
          <p className="mt-3 text-sm text-white/50">
            Saved locally on this device. <span className="text-neon-cyan">Sign in</span> to sync across devices.
          </p>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-surface-card border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div data-testid="wishlist-empty" className="card-gadget p-14 text-center">
          <div className="w-14 h-14 grid place-items-center rounded-full bg-neon-magenta/10 border border-neon-magenta/30 mx-auto text-neon-magenta">
            <Heart size={22} weight="bold" />
          </div>
          <h3 className="font-heading font-bold text-2xl mt-5">Nothing saved yet.</h3>
          <p className="text-sm text-white/50 mt-2 max-w-sm mx-auto">
            Tap the heart on any gadget to keep it here for later.
          </p>
          <Link to="/browse" className="btn-neon mt-7 inline-block">
            Browse gadgets
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((g, i) => (
            <GadgetCard key={g.id} gadget={g} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
