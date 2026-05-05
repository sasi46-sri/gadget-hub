import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Lightning, Scales, Heart, Cpu } from "@phosphor-icons/react";
import { http } from "@/api/client";
import GadgetCard from "@/components/GadgetCard";
import { categoryLabel } from "@/lib/format";

const categoryMedia = {
  smartphones: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900&q=80",
  laptops: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=900&q=80",
  headphones: "https://images.unsplash.com/photo-1545127398-14699f92334b?w=900&q=80",
  smartwatches: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=900&q=80",
  tablets: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=900&q=80",
};

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    http.get("/gadgets?sort=rating_desc").then(({ data }) => setFeatured(data.slice(0, 6)));
    http.get("/gadgets/meta").then(({ data }) => setCategories(data.categories || []));
  }, []);

  return (
    <div data-testid="home-page" className="pt-24">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            backgroundImage:
              "url(https://images.pexels.com/photos/7429526/pexels-photo-7429526.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1080&w=1920)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-surface-base/60 via-surface-base/85 to-surface-base" />
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-14 pt-16 md:pt-24 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <div className="chip chip-cyan mb-6" data-testid="hero-tag">
              <Lightning size={12} weight="fill" /> The Tech Index · 2026
            </div>
            <h1 className="font-heading font-black text-5xl sm:text-6xl lg:text-7xl tracking-tighter leading-[0.95]">
              Decide on tech, <br />
              <span className="text-gradient">without the noise.</span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-white/60 max-w-xl leading-relaxed">
              Browse, filter and compare cutting-edge gadgets — phones, laptops, headphones,
              smartwatches and tablets — in a single, opinion-free, spec-first interface.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/browse" data-testid="hero-cta-browse" className="btn-neon">
                Explore catalog <ArrowRight size={14} weight="bold" className="inline ml-2" />
              </Link>
              <Link to="/compare" data-testid="hero-cta-compare" className="btn-ghost-neon">
                Compare gadgets
              </Link>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-6 max-w-md">
              {[
                { k: "40+", v: "Gadgets" },
                { k: "5", v: "Categories" },
                { k: "18", v: "Brands" },
              ].map((s, i) => (
                <div key={i}>
                  <div className="font-heading font-black text-3xl text-neon-cyan">{s.k}</div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-mono mt-1">
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CATEGORY BENTO */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-14 py-16">
        <SectionHeader
          eyebrow="Browse by category"
          title="Pick your playground."
          link={{ to: "/browse", label: "View all" }}
        />
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-4">
          {categories.map((c, i) => {
            // Bento sizing
            const span =
              i === 0 ? "lg:col-span-7 lg:row-span-2 aspect-[16/10]" :
              i === 1 ? "lg:col-span-5 aspect-[16/10]" :
              i === 2 ? "lg:col-span-4 aspect-[16/10]" :
              "lg:col-span-4 aspect-[16/10]";
            return (
              <Link
                key={c}
                to={`/browse?category=${c}`}
                data-testid={`home-category-${c}`}
                className={`relative overflow-hidden rounded-2xl border border-white/10 group ${span}`}
              >
                <img
                  src={categoryMedia[c]}
                  alt={c}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/90 via-black/40 to-transparent" />
                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-neon-cyan font-mono">
                    Category · {String(i + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-2xl md:text-3xl">{categoryLabel(c)}</h3>
                    <div className="flex items-center gap-2 mt-2 text-xs uppercase tracking-[0.2em] text-white/70 group-hover:text-neon-cyan transition">
                      Explore <ArrowRight size={12} weight="bold" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-14 py-16">
        <SectionHeader
          eyebrow="Top rated"
          title="Crowd favorites right now."
          link={{ to: "/browse?sort=rating_desc", label: "See all" }}
        />
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((g, i) => (
            <GadgetCard key={g.id} gadget={g} index={i} />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-14 py-20">
        <SectionHeader eyebrow="The flow" title="Three moves. Zero friction." />
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {[
            { icon: Cpu, title: "Discover", desc: "Filter and search across 40+ gadgets in a unified, spec-first catalog." },
            { icon: Scales, title: "Compare", desc: "Stack up to four gadgets side-by-side. We highlight the winner per spec." },
            { icon: Heart, title: "Curate", desc: "Wishlist what you love. Sign in and your list syncs everywhere." },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="card-gadget p-7"
            >
              <div className="w-12 h-12 grid place-items-center rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan">
                <s.icon size={22} weight="bold" />
              </div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-mono mt-5">
                Step {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="font-heading font-black text-2xl mt-1">{s.title}</h3>
              <p className="text-sm text-white/60 mt-2 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ eyebrow, title, link }) {
  return (
    <div className="flex items-end justify-between gap-6 flex-wrap">
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-neon-cyan/80 font-mono">{eyebrow}</div>
        <h2 className="mt-2 font-heading font-black text-3xl md:text-4xl tracking-tight">{title}</h2>
      </div>
      {link && (
        <Link
          to={link.to}
          className="text-xs uppercase tracking-[0.25em] text-white/60 hover:text-neon-cyan flex items-center gap-2"
        >
          {link.label} <ArrowRight size={12} weight="bold" />
        </Link>
      )}
    </div>
  );
}
