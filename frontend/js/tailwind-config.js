/**
 * Shared Tailwind CSS configuration for all Mind Mate pages.
 * Canonical source of truth — do NOT define tailwind.config in individual HTML pages.
 */
window.tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary":          "#13ec80",
        "background-light": "#f6f8f7",
        "background-dark":  "#102219",
        "surface-dark":     "#1a2c24",
        "surface-dark-hover": "#22382e",
        "surface-light":    "#ffffff",
        "card-dark":        "#15281e",
        "card-inner":       "#15221a",
        "card-border":      "#283930",
        "text-secondary":   "#9db9ab",
      },
      fontFamily: {
        "display": ["Lexend", "sans-serif"],
        "body":    ["Noto Sans", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg":      "1rem",
        "xl":      "1.5rem",
        "2xl":     "2rem",
        "full":    "9999px",
      },
    },
  },
};
