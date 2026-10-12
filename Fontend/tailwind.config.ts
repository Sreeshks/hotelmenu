import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          950: "var(--brand-950, #38030e)",
          900: "var(--brand-900, #5b0618)",
          850: "var(--brand-850, #720920)",
          800: "var(--brand-800, #800020)",
          700: "var(--brand-700, #9e0e31)",
          600: "var(--brand-600, #bf1740)",
          100: "var(--brand-100, #fce8ed)",
          50: "var(--brand-50, #fdf2f4)",
        },
        gold: {
          50: "var(--gold-50, #faf7ee)",
          100: "var(--gold-100, #f7f1df)",
          200: "var(--gold-200, #eedcb3)",
          300: "var(--gold-300, #e4c683)",
          400: "var(--gold-400, #d6b866)",
          500: "var(--gold-500, #D4AF37)",
          600: "var(--gold-600, #ab8835)",
          700: "var(--gold-700, #866624)",
        },
        surface: {
          bg: "#F8F7F3",
          card: "#FFFFFF",
          muted: "#F0EFEA",
          border: "#E7E5DD",
        },
        text: {
          primary: "#17201B",
          secondary: "#5C6660",
          muted: "#8C9690",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(6, 59, 42, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)",
        cardHover: "0 10px 25px -4px rgba(6, 59, 42, 0.1), 0 4px 10px -2px rgba(0, 0, 0, 0.04)",
        goldGlow: "0 4px 15px -1px rgba(198, 162, 74, 0.25)",
        bottomNav: "0 -4px 20px rgba(6, 59, 42, 0.06)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
