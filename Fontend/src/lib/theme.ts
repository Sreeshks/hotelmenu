/**
 * Color manipulation & theme applicator for Customer Digital Menu
 * Dynamically updates CSS variables so Tailwind utilities (bg-brand-900, text-brand-950, etc.)
 * reflect the chosen theme in real time.
 */

interface HSL {
  h: number;
  s: number;
  l: number;
}

function hexToHSL(hex: string): HSL {
  let cleanHex = hex.replace("#", "").trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map((c) => c + c).join("");
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function applyThemeColors(primaryHex?: string | null, secondaryHex?: string | null, accentHex?: string | null) {
  if (typeof window === "undefined") return;

  const primary = primaryHex || "#063B2A"; // Default Emerald Luxury Green (#063B2A)
  const secondary = secondaryHex || "#C6A24A"; // Royal Champagne Gold (#C6A24A)
  const root = document.documentElement;

  try {
    const hsl = hexToHSL(primary);

    // Derive semantic brand tints & shades from primary color
    const brand950 = hslToHex(hsl.h, Math.min(100, hsl.s + 10), 12); // Deepest dark header/text
    const brand900 = hslToHex(hsl.h, hsl.s, 19); // Primary rich dark base (e.g. #580a1c)
    const brand850 = hslToHex(hsl.h, hsl.s, 24);
    const brand800 = primary; // Chosen Primary (e.g. #800020)
    const brand700 = hslToHex(hsl.h, hsl.s, 34);
    const brand600 = hslToHex(hsl.h, hsl.s, 42);
    const brand100 = hslToHex(hsl.h, Math.max(20, hsl.s - 20), 93); // Soft pastel tag pill
    const brand50 = hslToHex(hsl.h, Math.max(10, hsl.s - 30), 97);  // Ultra light card accent

    // Accent/Gold shades
    const secHsl = hexToHSL(secondary);
    const gold500 = secondary;
    const gold400 = hslToHex(secHsl.h, secHsl.s, Math.min(85, secHsl.l + 10));
    const gold300 = hslToHex(secHsl.h, secHsl.s, Math.min(90, secHsl.l + 18));
    const gold600 = hslToHex(secHsl.h, secHsl.s, Math.max(15, secHsl.l - 10));
    const gold100 = hslToHex(secHsl.h, Math.max(20, secHsl.s - 30), 94);
    const gold50 = hslToHex(secHsl.h, Math.max(10, secHsl.s - 40), 97);

    root.style.setProperty("--brand-950", brand950);
    root.style.setProperty("--brand-900", brand900);
    root.style.setProperty("--brand-850", brand850);
    root.style.setProperty("--brand-800", brand800);
    root.style.setProperty("--brand-700", brand700);
    root.style.setProperty("--brand-600", brand600);
    root.style.setProperty("--brand-100", brand100);
    root.style.setProperty("--brand-50", brand50);

    root.style.setProperty("--gold-600", gold600);
    root.style.setProperty("--gold-500", gold500);
    root.style.setProperty("--gold-400", gold400);
    root.style.setProperty("--gold-300", gold300);
    root.style.setProperty("--gold-100", gold100);
    root.style.setProperty("--gold-50", gold50);
  } catch (e) {
    console.warn("Failed to compute custom theme colors:", e);
  }
}
