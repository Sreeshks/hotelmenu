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
          950: "var(--brand-950, #021a12)",
          900: "var(--brand-900, #063B2A)",
          850: "var(--brand-850, #0a4834)",
          800: "var(--brand-800, #0f5840)",
          700: "var(--brand-700, #167052)",
          600: "var(--brand-600, #1e8b67)",
          100: "var(--brand-100, #d6ebe1)",
          50: "var(--brand-50, #eff7f3)",
        },
        gold: {
          50: "var(--gold-50, #fcf9f1)",
          100: "var(--gold-100, #f8f2e0)",
          200: "var(--gold-200, #eedec0)",
          300: "var(--gold-300, #e2c78a)",
          400: "var(--gold-400, #d4b463)",
          500: "var(--gold-500, #C6A24A)",
          600: "var(--gold-600, #aa8534)",
          700: "var(--gold-700, #886524)",
        },
        hotel: {
          dark: "var(--brand-900, #063B2A)",
          gold: "var(--gold-500, #C6A24A)",
          cream: "#F8F7F3",
          text: "#17201B",
          card: "#FFFFFF",
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
        serif: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "Inter", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(6, 59, 42, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)",
        cardHover: "0 14px 30px -4px rgba(6, 59, 42, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.04)",
        goldGlow: "0 4px 18px -1px rgba(198, 162, 74, 0.35)",
        bottomNav: "0 -4px 24px rgba(6, 59, 42, 0.07)",
        elevated: "0 20px 40px -8px rgba(6, 59, 42, 0.16)",
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
