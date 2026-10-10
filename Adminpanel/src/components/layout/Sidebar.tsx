"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Tags,
  Image as ImageIcon,
  Users,
  Star,
  QrCode,
  Settings,
  LogOut,
  ExternalLink,
  Crown,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLiveUpdates } from "@/components/providers/WebSocketProvider";
import { useSettings } from "@/components/providers/SettingsProvider";
import { CUSTOMER_MENU_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onCloseMobile?: () => void;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Menu Items", href: "/menu", icon: UtensilsCrossed },
  { label: "Categories", href: "/categories", icon: Tags },
  { label: "Banners", href: "/banners", icon: ImageIcon },
  { label: "Staff", href: "/staff", icon: Users },
  { label: "Reviews", href: "/reviews", icon: Star },
  { label: "Menu QR Code", href: "/locations", icon: QrCode },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { admin, logout } = useAuth();
  const { isConnected } = useLiveUpdates();
  const { restaurantName } = useSettings();

  return (
    <aside className="w-64 bg-brand-900 text-stone-100 flex flex-col h-full border-r border-brand-850 shadow-xl select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-brand-850/80 flex items-center justify-between">
        <Link
          href="/dashboard"
          onClick={onCloseMobile}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-brand-900 shadow-gold shadow-md">
            <Crown className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="font-serif text-lg font-bold tracking-tight text-white block leading-tight">
              {restaurantName}
            </span>
            <span className="text-[10px] tracking-widest uppercase text-gold-400 font-semibold block">
              Admin Panel
            </span>
          </div>
        </Link>
      </div>

      {/* Live Sync Status Banner */}
      <div className="px-5 py-2.5 bg-brand-850/50 border-b border-brand-850/60 flex items-center justify-between text-[11px]">
        <span className="text-stone-300 font-medium">Real-Time Sync</span>
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              isConnected
                ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                : "bg-amber-400"
            )}
          />
          <span className={isConnected ? "text-emerald-300" : "text-amber-300"}>
            {isConnected ? "Live Active" : "Connecting..."}
          </span>
        </span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
                isActive
                  ? "bg-brand-700/80 text-white shadow-sm border-l-4 border-gold-400 font-semibold"
                  : "text-stone-300 hover:text-white hover:bg-brand-850/60"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 transition-transform group-hover:scale-110",
                  isActive ? "text-gold-400" : "text-stone-400 group-hover:text-stone-200"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* View Customer Menu link */}
        <div className="pt-4 mt-4 border-t border-brand-850/60 px-1">
          <a
            href={CUSTOMER_MENU_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gold-300 bg-brand-850/80 hover:bg-brand-800 border border-gold-500/20 transition-all hover:scale-[1.01]"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview Live Menu</span>
            </span>
            <span className="text-[10px] bg-gold-500/20 text-gold-300 px-1.5 py-0.5 rounded font-mono">
              3000
            </span>
          </a>
        </div>
      </nav>

      {/* Bottom Profile & Logout */}
      <div className="p-4 border-t border-brand-850 bg-brand-900/90 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-600 border border-brand-500/30 flex items-center justify-center font-bold text-xs text-gold-300 uppercase shrink-0">
            {admin?.name?.charAt(0) || "A"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{admin?.name || "Administrator"}</p>
            <p className="text-[10px] text-stone-400 truncate capitalize">{admin?.role || "Admin"}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="p-2 text-stone-400 hover:text-red-300 hover:bg-brand-800 rounded-lg transition-colors shrink-0"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
