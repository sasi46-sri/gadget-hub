import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Scales, Star, ShareNetwork } from "@phosphor-icons/react";
import { http } from "@/api/client";
import { useWishlist } from "@/context/WishlistContext";
import { useCompare } from "@/context/CompareContext";
import { formatPrice, categoryLabel } from "@/lib/format";
import { toast } from "sonner";

export default function GadgetDetailPage() {
  const { id } = useParams();
  const [g, setG] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const { isWishlisted, toggle: toggleWish } = useWishlist();
  const { inCompare, toggle: toggleCompare } = useCompare();

  useEffect(() => {
    setLoading(true);
    http
      .get(`/gadgets/${id}`)
      .then(({ data }) => {
        setG(data);
        return http.get(`/gadgets?category=${data.category}`);
      })
      .then(({ data }) => {
        setRelated(data.filter((x) => x.id !== id).slice(0, 4));
      })
      .catch(() => setG(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="pt-32 max-w-[1400px] mx-auto px-6 md:px-10 lg:px-14">
        <div className="h-96 rounded-2xl bg-surface-card animate-pulse" />
      </div>
    );
  }

  if (!g) {
    return (
      <div data-testid="gadget-not-found" className="pt-32 max-w-[1400px] mx-auto px-6 md:px-10 lg:px-14 text-center">
        <h1 className="font-heading font-black text-4xl">Gadget not found</h1>
        <Link to="/browse" className="btn-neon mt-6 inline-block">
          Back to catalog
        </Link>
      </div>
    );
  }

  const wished = isWishlisted(g.id);
  const compared = inCompare(g.id);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: g.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div data-testid="gadget-detail-page" className="pt-24">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-14 pt-6">
        <Link to="/browse" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/50 hover:text-neon-cyan">
          <ArrowLeft size={12} /> Back to catalog
        </Link>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-14 py-10 grid lg:grid-cols-[1.1fr_1fr] gap-12">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55 }}
          className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-black"
        >
          <img src={g.image} alt={g.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-black/40 via-transparent to-transparent" />
          <div className="absolute top-5 left-5 chip chip-cyan">{categoryLabel(g.category)}</div>
        </motion.div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-mono">{g.brand}</div>
          <h1 className="font-heading font-black text-4xl md:text-5xl tracking-tighter mt-2 leading-[0.95]">
            {g.name}
          </h1>

          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Star size={16} weight="fill" className="text-neon-yellow" />
              <span className="font-mono">{g.rating.toFixed(1)}</span>
              <span className="text-white/40">/ 5.0</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="text-white/50 font-mono uppercase tracking-[0.2em] text-xs">{categoryLabel(g.category)}</div>
          </div>

          <p className="mt-6 text-white/70 leading-relaxed">{g.description}</p>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-end gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-mono">Price</div>
              <div className="font-heading font-black text-4xl text-neon-cyan mt-1">{formatPrice(g.price)}</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              data-testid="detail-compare-btn"
              onClick={() => toggleCompare(g)}
              className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3.5 px-6 uppercase tracking-[0.18em] text-xs font-bold transition ${
                compared
                  ? "bg-neon-cyan/10 border border-neon-cyan text-neon-cyan"
                  : "border border-white/15 hover:border-neon-cyan hover:text-neon-cyan"
              }`}
            >
              <Scales size={16} weight="bold" />
              {compared ? "Added to compare" : "Add to compare"}
            </button>
            <button
              data-testid="detail-wishlist-btn"
              onClick={() => toggleWish(g)}
              className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3.5 px-6 uppercase tracking-[0.18em] text-xs font-bold transition ${
                wished
                  ? "bg-neon-magenta/10 border border-neon-magenta text-neon-magenta"
                  : "border border-white/15 hover:border-neon-magenta hover:text-neon-magenta"
              }`}
            >
              <Heart size={16} weight={wished ? "fill" : "bold"} />
              {wished ? "Wishlisted" : "Wishlist"}
            </button>
            <button
              data-testid="detail-share-btn"
              onClick={share}
              aria-label="Share"
              className="grid place-items-center w-12 h-12 border border-white/15 hover:border-neon-cyan hover:text-neon-cyan"
            >
              <ShareNetwork size={16} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* Specs */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-14 pb-16">
        <h2 className="font-heading font-black text-2xl md:text-3xl mb-6">Full Specifications</h2>
        <div className="card-gadget p-2 md:p-4">
          {Object.entries(g.specs).map(([k, v]) => (
            <div key={k} className="spec-row md:px-4">
              <div className="spec-label">{k}</div>
              <div className="spec-value">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-14 pb-20">
          <h2 className="font-heading font-black text-2xl md:text-3xl mb-6">More in {categoryLabel(g.category)}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map((r, i) => (
              <Link
                key={r.id}
                to={`/gadgets/${r.id}`}
                className="card-gadget p-0 overflow-hidden block"
                data-testid={`related-${r.id}`}
              >
                <div className="aspect-[4/3] bg-black overflow-hidden">
                  <img src={r.image} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-4">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">{r.brand}</div>
                  <div className="font-heading font-bold text-base line-clamp-2">{r.name}</div>
                  <div className="font-heading font-black text-neon-cyan mt-2">{formatPrice(r.price)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
