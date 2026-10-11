import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          900: "#06281e",
          850: "#0a382a",
          800: "#0d4434",
          700: "#135842",
          600: "#1b7055",
          500: "#268c6b",
          100: "#e6f4ef",
          50: "#f0f9f5",
        },
        gold: {
          50: "#fbf8ee",
          100: "#f6efd5",
          200: "#eddba9",
          300: "#e2c375",
          400: "#d9ad48",
          500: "#c7962d", // Primary luxury gold
          600: "#aa7722",
          700: "#86561d",
        },
        surface: {
          bg: "#f8faf9",
          card: "#ffffff",
          muted: "#f1f5f3",
          border: "#e2e8e5",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(10, 61, 44, 0.06)",
        card: "0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)",
        gold: "0 4px 14px 0 rgba(199, 150, 45, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
