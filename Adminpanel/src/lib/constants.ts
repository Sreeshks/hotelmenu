export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/api/v1/ws";

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export const CUSTOMER_MENU_URL =
  process.env.NEXT_PUBLIC_CUSTOMER_MENU_URL || "https://menu.orcux.co.in";

export const TOKEN_STORAGE_KEY = "hotel_menu_admin_token";
export const ADMIN_STORAGE_KEY = "hotel_menu_admin_profile";

export const NAVIGATION_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Menu Items", href: "/menu", icon: "UtensilsCrossed" },
  { label: "Categories", href: "/categories", icon: "Tags" },
  { label: "Banners", href: "/banners", icon: "Image" },
  { label: "Staff", href: "/staff", icon: "Users" },
  { label: "Reviews", href: "/reviews", icon: "Star" },
  { label: "Locations & QR", href: "/locations", icon: "QrCode" },
  { label: "Settings", href: "/settings", icon: "Settings" },
];
