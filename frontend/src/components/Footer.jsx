import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="relative mt-24 border-t border-white/5 bg-black/40">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-14 py-12 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="font-heading font-black text-2xl tracking-tight">
            gadgets<span className="text-neon-cyan">/</span>hub
          </div>
          <p className="text-sm text-white/50 mt-3 max-w-md">
            Discover, compare, and curate the world's most exciting consumer tech — phones,
            laptops, audio gear, wearables and tablets, all in one place.
          </p>
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/30 mt-6 font-mono">
            © {new Date().getFullYear()} GadgetsHub. All specs informational.
          </div>
        </div>
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-3 font-mono">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/browse" className="text-white/70 hover:text-neon-cyan">Catalog</Link></li>
            <li><Link to="/compare" className="text-white/70 hover:text-neon-cyan">Compare</Link></li>
            <li><Link to="/wishlist" className="text-white/70 hover:text-neon-cyan">Wishlist</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-3 font-mono">Categories</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/browse?category=smartphones" className="text-white/70 hover:text-neon-cyan">Smartphones</Link></li>
            <li><Link to="/browse?category=laptops" className="text-white/70 hover:text-neon-cyan">Laptops</Link></li>
            <li><Link to="/browse?category=headphones" className="text-white/70 hover:text-neon-cyan">Audio</Link></li>
            <li><Link to="/browse?category=smartwatches" className="text-white/70 hover:text-neon-cyan">Wearables</Link></li>
            <li><Link to="/browse?category=tablets" className="text-white/70 hover:text-neon-cyan">Tablets</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
