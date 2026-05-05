// Currency formatting for INR
export function formatPrice(value) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function categoryLabel(slug) {
  const map = {
    smartphones: "Smartphones",
    laptops: "Laptops",
    headphones: "Audio",
    smartwatches: "Wearables",
    tablets: "Tablets",
  };
  return map[slug] || slug;
}
