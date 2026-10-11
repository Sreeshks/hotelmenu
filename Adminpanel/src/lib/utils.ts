import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency?: string): string {
  let curr = currency;
  if (!curr && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("hotel_admin_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.currencySymbol) curr = parsed.currencySymbol;
      }
    } catch {
      // fallback
    }
  }
  if (!curr) curr = "OMR ";
  const is3Decimals = curr.trim() === "OMR" || curr.trim() === "BHD" || curr.trim() === "KWD";
  const formattedNum = Number(price).toFixed(is3Decimals ? 3 : 2);
  const cleanCurrency = curr.endsWith(" ") || curr.length === 1 ? curr : `${curr} `;
  return `${cleanCurrency}${formattedNum}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
}

export function resolveImageUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  return `${backendBase.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}
