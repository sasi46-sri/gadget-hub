import { Link, NavLink, useNavigate } from "react-router-dom";
import { Heart, Scales, MagnifyingGlass, User, SignOut, List, X } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useCompare } from "@/context/CompareContext";
import { useWishlist } from "@/context/WishlistContext";
import { useState } from "react";
import AuthModal from "@/components/AuthModal";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/browse", label: "Catalog" },
  { to: "/compare", label: "Compare" },
  { to: "/wishlist", label: "Wishlist" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { items: compareItems } = useCompare();
  const { ids: wishIds } = useWishlist();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const navigate = useNavigate();

  const openAuth = (mode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <>
      <header
        data-testid="navbar"
        className="fixed top-0 inset-x-0 z-50 glass border-b border-white/10"
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-14 py-4 flex items-center justify-between gap-4">
          <Link to="/" data-testid="nav-logo" className="flex items-center gap-2 group">
            <div className="relative w-9 h-9 grid place-items-center">
              <span className="absolute inset-0 bg-neon-cyan/20 blur-md rounded-full group-hover:bg-neon-cyan/40 transition" />
              <span className="relative font-heading font-black text-neon-cyan text-xl">G</span>
              <span className="absolute inset-0 border border-neon-cyan/40 rounded-full" />
            </div>
            <div className="leading-none">
              <div className="font-heading font-black text-white text-lg tracking-tight">
                gadgets<span className="text-neon-cyan">/</span>hub
              </div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">discover · compare</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                data-testid={`nav-link-${l.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `px-4 py-2 text-sm uppercase tracking-[0.18em] font-medium transition-colors relative ${
                    isActive ? "text-neon-cyan" : "text-white/70 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {l.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-6 bg-neon-cyan shadow-[0_0_8px_#00f0ff]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              data-testid="nav-search-btn"
              onClick={() => navigate("/browse")}
              className="hidden sm:grid place-items-center w-10 h-10 rounded-full border border-white/10 hover:border-neon-cyan/60 hover:text-neon-cyan transition"
              aria-label="Search"
            >
              <MagnifyingGlass size={18} weight="bold" />
            </button>

            <Link
              to="/compare"
              data-testid="nav-compare-btn"
              className="relative grid place-items-center w-10 h-10 rounded-full border border-white/10 hover:border-neon-cyan/60 hover:text-neon-cyan transition"
              aria-label="Compare"
            >
              <Scales size={18} weight="bold" />
              {compareItems.length > 0 && (
                <span
                  data-testid="compare-badge"
                  className="absolute -top-1 -right-1 bg-neon-cyan text-black text-[10px] font-bold w-5 h-5 grid place-items-center rounded-full"
                >
                  {compareItems.length}
                </span>
              )}
            </Link>

            <Link
              to="/wishlist"
              data-testid="nav-wishlist-btn"
              className="relative grid place-items-center w-10 h-10 rounded-full border border-white/10 hover:border-neon-magenta/60 hover:text-neon-magenta transition"
              aria-label="Wishlist"
            >
              <Heart size={18} weight="bold" />
              {wishIds.length > 0 && (
                <span
                  data-testid="wishlist-badge"
                  className="absolute -top-1 -right-1 bg-neon-magenta text-white text-[10px] font-bold w-5 h-5 grid place-items-center rounded-full"
                >
                  {wishIds.length}
                </span>
              )}
            </Link>

            {/* Auth actions */}
            {user === undefined ? (
              <div className="w-20 h-10 rounded-full bg-white/5 animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  data-testid="nav-user-btn"
                  onClick={() => setUserMenu((v) => !v)}
                  className="flex items-center gap-2 px-3 h-10 rounded-full border border-white/10 hover:border-neon-cyan/60 transition"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple grid place-items-center text-black font-bold text-xs">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden sm:inline text-sm">{user.name?.split(" ")[0]}</span>
                </button>
                {userMenu && (
                  <div
                    data-testid="user-menu"
                    className="absolute right-0 mt-2 w-56 glass rounded-xl p-2 border border-white/10"
                    onMouseLeave={() => setUserMenu(false)}
                  >
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs text-white/50 truncate">{user.email}</div>
                    </div>
                    <button
                      data-testid="nav-logout-btn"
                      onClick={() => {
                        logout();
                        setUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 rounded-md text-white/80 hover:text-neon-magenta"
                    >
                      <SignOut size={16} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  data-testid="nav-login-btn"
                  onClick={() => openAuth("login")}
                  className="text-sm uppercase tracking-[0.18em] px-3 text-white/70 hover:text-white"
                >
                  Login
                </button>
                <button
                  data-testid="nav-signup-btn"
                  onClick={() => openAuth("register")}
                  className="text-xs uppercase tracking-[0.2em] font-bold bg-neon-cyan text-black px-4 py-2 hover:bg-white transition"
                >
                  Sign up
                </button>
              </div>
            )}

            <button
              data-testid="nav-mobile-toggle"
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden grid place-items-center w-10 h-10 rounded-full border border-white/10"
              aria-label="Menu"
            >
              {menuOpen ? <X size={18} /> : <List size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 bg-surface-base/95 backdrop-blur-xl">
            <div className="px-6 py-4 flex flex-col gap-2">
              {navLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  data-testid={`mobile-nav-${l.label.toLowerCase()}`}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `py-2 text-sm uppercase tracking-[0.18em] ${
                      isActive ? "text-neon-cyan" : "text-white/70"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              {!user && (
                <div className="flex gap-2 pt-2">
                  <button
                    data-testid="mobile-login-btn"
                    onClick={() => {
                      openAuth("login");
                      setMenuOpen(false);
                    }}
                    className="flex-1 btn-ghost-neon py-2"
                  >
                    Login
                  </button>
                  <button
                    data-testid="mobile-signup-btn"
                    onClick={() => {
                      openAuth("register");
                      setMenuOpen(false);
                    }}
                    className="flex-1 btn-neon py-2"
                  >
                    Sign up
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </>
  );
}
