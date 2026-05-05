import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

const CompareContext = createContext(null);
const LS_KEY = "gh_compare";
const MAX = 4;

export function CompareProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }, [items]);

  const inCompare = (id) => items.some((g) => g.id === id);

  const toggle = (gadget) => {
    setItems((prev) => {
      const exists = prev.some((g) => g.id === gadget.id);
      if (exists) {
        toast.success("Removed from compare", { description: gadget.name });
        return prev.filter((g) => g.id !== gadget.id);
      }
      if (prev.length >= MAX) {
        toast.error(`You can compare up to ${MAX} gadgets`);
        return prev;
      }
      // Optionally enforce same category
      if (prev.length > 0 && prev[0].category !== gadget.category) {
        toast.error("Compare within same category", {
          description: `You're comparing ${prev[0].category}. Clear compare to switch.`,
        });
        return prev;
      }
      toast.success("Added to compare", { description: gadget.name });
      return [...prev, gadget];
    });
  };

  const remove = (id) => setItems((prev) => prev.filter((g) => g.id !== id));
  const clear = () => setItems([]);

  return (
    <CompareContext.Provider value={{ items, inCompare, toggle, remove, clear, max: MAX }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
