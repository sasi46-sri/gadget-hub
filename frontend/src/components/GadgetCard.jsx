import { Link } from "react-router-dom";
import { Heart, Scales, Star } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { useWishlist } from "@/context/WishlistContext";
import { useCompare } from "@/context/CompareContext";
import { formatPrice, categoryLabel } from "@/lib/format";

export default function GadgetCard({ gadget, index = 0 }) {
  const { isWishlisted, toggle: toggleWish } = useWishlist();
  const { inCompare, toggle: toggleCompare } = useCompare();
  const wished = isWishlisted(gadget.id);
  const compared = inCompare(gadget.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className="card-gadget group flex flex-col"
      data-testid={`gadget-card-${gadget.id}`}
    >
      <Link to={`/gadgets/${gadget.id}`} className="block relative aspect-[4/3] overflow-hidden bg-black">
        <div
          className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-purple/5"
          aria-hidden="true"
        />
        <img
          src={gadget.image}
          alt={gadget.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 chip chip-cyan text-[10px]">{categoryLabel(gadget.category)}</div>
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs font-mono">
          <Star size={12} weight="fill" className="text-neon-yellow" />
          <span>{gadget.rating.toFixed(1)}</span>
        </div>
      </Link>

      <div className="flex flex-col gap-3 p-5 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-medium">
              {gadget.brand}
            </div>
            <Link
              to={`/gadgets/${gadget.id}`}
              className="block font-heading font-bold text-lg leading-tight hover:text-neon-cyan transition-colors line-clamp-2"
            >
              {gadget.name}
            </Link>
          </div>
        </div>

        <div className="text-xs text-white/50 line-clamp-2 leading-relaxed">{gadget.description}</div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">Price</div>
            <div className="font-heading font-black text-xl text-white">{formatPrice(gadget.price)}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              data-testid={`compare-toggle-${gadget.id}`}
              onClick={() => toggleCompare(gadget)}
              aria-label="Toggle compare"
              className={`w-9 h-9 grid place-items-center rounded-full border transition-all ${
                compared
                  ? "border-neon-cyan text-neon-cyan bg-neon-cyan/10 shadow-[0_0_12px_rgba(0,240,255,0.35)]"
                  : "border-white/10 text-white/70 hover:border-neon-cyan/60 hover:text-neon-cyan"
              }`}
            >
              <Scales size={16} weight={compared ? "fill" : "bold"} />
            </button>
            <button
              data-testid={`wishlist-toggle-${gadget.id}`}
              onClick={() => toggleWish(gadget)}
              aria-label="Toggle wishlist"
              className={`w-9 h-9 grid place-items-center rounded-full border transition-all ${
                wished
                  ? "border-neon-magenta text-neon-magenta bg-neon-magenta/10 shadow-[0_0_12px_rgba(255,0,60,0.35)]"
                  : "border-white/10 text-white/70 hover:border-neon-magenta/60 hover:text-neon-magenta"
              }`}
            >
              <Heart size={16} weight={wished ? "fill" : "bold"} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
