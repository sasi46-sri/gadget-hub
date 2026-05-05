import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { http } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const WishlistContext = createContext(null);
const LS_KEY = "gh_wishlist_local";

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [ids, setIds] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Sync with server when logged in
  const syncFromServer = useCallback(async () => {
    try {
      const { data } = await http.get("/wishlist/ids");
      setIds(data.gadget_ids || []);
    } catch {
      /* fall back to local */
    }
  }, []);

  useEffect(() => {
    if (user) {
      // Merge local into server then pull
      const local = (() => {
        try {
          return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
        } catch {
          return [];
        }
      })();
      (async () => {
        for (const gid of local) {
          try {
            await http.post("/wishlist/add", { gadget_id: gid });
          } catch {
            /* ignore */
          }
        }
        localStorage.removeItem(LS_KEY);
        await syncFromServer();
      })();
    }
  }, [user, syncFromServer]);

  // Persist locally when anonymous
  useEffect(() => {
    if (!user) {
      localStorage.setItem(LS_KEY, JSON.stringify(ids));
    }
  }, [ids, user]);

  const isWishlisted = (id) => ids.includes(id);

  const toggle = async (gadget) => {
    const id = gadget.id;
    const currently = ids.includes(id);
    if (user) {
      try {
        const endpoint = currently ? "/wishlist/remove" : "/wishlist/add";
        const { data } = await http.post(endpoint, { gadget_id: id });
        setIds(data.gadget_ids || []);
        toast.success(currently ? "Removed from wishlist" : "Added to wishlist", {
          description: gadget.name,
        });
      } catch {
        toast.error("Could not update wishlist");
      }
    } else {
      setIds((prev) => (currently ? prev.filter((x) => x !== id) : [...prev, id]));
      toast.success(currently ? "Removed from wishlist" : "Added to wishlist", {
        description: `${gadget.name} · saved locally`,
      });
    }
  };

  return (
    <WishlistContext.Provider value={{ ids, isWishlisted, toggle, syncFromServer }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
