import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export function resolveImageUrl(url?: string | null): string {
  if (!url) return "/placeholder-dish.jpg";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  // Remove leading slash if both have it
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${BACKEND_URL}${cleanPath}`;
}

export function formatPrice(amount: number, currency: string = "OMR "): string {
  return `${currency}${Number(amount).toFixed(3)}`;
}

export const formatCurrency = formatPrice;

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Returns or generates a persistent anonymous customer identifier for review submissions
 */
export function getCustomerIdentifier(): string {
  if (typeof window === "undefined") return "guest-web-client";
  const KEY = "hotel_menu_customer_uid";
  let uid = localStorage.getItem(KEY);
  if (!uid) {
    uid = `guest_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
    localStorage.setItem(KEY, uid);
  }
  return uid;
}
