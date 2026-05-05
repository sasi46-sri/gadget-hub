import { Link } from "react-router-dom";
import { Scales, X, ArrowRight } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useCompare } from "@/context/CompareContext";

export default function CompareTray() {
  const { items, remove, clear } = useCompare();

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          data-testid="compare-tray"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 inset-x-4 md:inset-x-auto md:right-6 md:bottom-6 z-40 max-w-2xl md:w-[640px] glass rounded-2xl border border-neon-cyan/30 shadow-[0_0_40px_-10px_rgba(0,240,255,0.4)]"
        >
          <div className="p-4 flex items-center gap-3">
            <div className="grid place-items-center w-10 h-10 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan">
              <Scales size={18} weight="bold" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/50">Comparing</div>
              <div className="text-sm font-medium truncate">
                {items.length} item{items.length > 1 ? "s" : ""}
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 max-w-[260px] overflow-hidden">
              {items.map((g) => (
                <div key={g.id} className="relative w-10 h-10 rounded-md overflow-hidden border border-white/10">
                  <img src={g.image} alt={g.name} className="w-full h-full object-cover" />
                  <button
                    data-testid={`tray-remove-${g.id}`}
                    onClick={() => remove(g.id)}
                    className="absolute inset-0 bg-black/70 grid place-items-center opacity-0 hover:opacity-100 transition"
                    aria-label={`Remove ${g.name}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <button
              data-testid="tray-clear-btn"
              onClick={clear}
              className="text-xs uppercase tracking-[0.2em] text-white/50 hover:text-neon-magenta px-2"
            >
              Clear
            </button>
            <Link
              to="/compare"
              data-testid="tray-go-compare-btn"
              className="flex items-center gap-2 bg-neon-cyan text-black font-bold uppercase text-xs tracking-[0.2em] px-4 py-2.5 hover:bg-white transition"
            >
              Compare <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
