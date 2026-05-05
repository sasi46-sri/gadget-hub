import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, EyeSlash, Eye } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { extractErrorMessage } from "@/api/client";

export default function AuthModal({ open, onClose, initialMode = "login" }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setErr("");
      setName("");
      setPassword("");
    }
  }, [open, initialMode]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (mode === "login") await login(email.trim(), password);
      else await register(name.trim(), email.trim(), password);
      onClose?.();
    } catch (e) {
      setErr(extractErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid="auth-modal"
          className="fixed inset-0 z-[100] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-md glass rounded-2xl p-7 border border-white/10 shadow-[0_0_60px_-10px_rgba(0,240,255,0.25)]"
          >
            <button
              data-testid="auth-close-btn"
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-full hover:bg-white/5 text-white/60"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <div className="text-[10px] uppercase tracking-[0.3em] text-neon-cyan/70 mb-1">
                gadgets/hub access
              </div>
              <h2 className="font-heading text-3xl font-black text-white">
                {mode === "login" ? "Welcome back." : "Join the grid."}
              </h2>
              <p className="text-sm text-white/50 mt-1">
                {mode === "login"
                  ? "Sign in to sync your wishlist across devices."
                  : "Create an account to save and compare gadgets."}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-white/50">Name</label>
                  <input
                    data-testid="auth-input-name"
                    type="text"
                    required
                    minLength={1}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-neon mt-1.5"
                    placeholder="Your name"
                  />
                </div>
              )}
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-white/50">Email</label>
                <input
                  data-testid="auth-input-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-neon mt-1.5"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-white/50">Password</label>
                <div className="relative">
                  <input
                    data-testid="auth-input-password"
                    type={showPw ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-neon mt-1.5 pr-12"
                    placeholder="••••••"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                    aria-label="Toggle password visibility"
                  >
                    {showPw ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {err && (
                <div data-testid="auth-error" className="text-sm text-neon-magenta bg-neon-magenta/10 border border-neon-magenta/30 px-3 py-2 rounded-md">
                  {err}
                </div>
              )}

              <button
                data-testid="auth-submit-btn"
                type="submit"
                disabled={busy}
                className="btn-neon w-full disabled:opacity-50"
              >
                {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            <div className="mt-5 text-center text-sm text-white/50">
              {mode === "login" ? (
                <>
                  New here?{" "}
                  <button
                    data-testid="auth-switch-to-register"
                    onClick={() => setMode("register")}
                    className="text-neon-cyan hover:underline font-medium"
                  >
                    Create account
                  </button>
                </>
              ) : (
                <>
                  Already a member?{" "}
                  <button
                    data-testid="auth-switch-to-login"
                    onClick={() => setMode("login")}
                    className="text-neon-cyan hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
