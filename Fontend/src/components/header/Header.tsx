"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, Info } from "lucide-react";
import { CustomerLocationInfo, RestaurantInfo } from "@/types";
import { useCustomerWebSocket } from "@/components/providers/WebSocketProvider";
import { resolveImageUrl } from "@/lib/utils";

interface HeaderProps {
  restaurant?: RestaurantInfo;
  location?: CustomerLocationInfo | null;
  onOpenDrawer?: () => void;
  onOpenRate?: () => void;
  qrToken?: string;
}

export function Header({
  restaurant,
  location,
  onOpenDrawer,
  qrToken,
}: HeaderProps) {
  const { isConnected } = useCustomerWebSocket();
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  const restaurantName = restaurant?.name || "Koottu Curry";
  const rawLogo = location?.logo_url || restaurant?.logo_url;
  const hasLogo = !!rawLogo && !logoLoadFailed;

  // Only show table or room badge when a table/room actually exists — never duplicate restaurant name
  const tableOrRoom = location?.table_number
    ? `Table ${location.table_number}`
    : location?.room_number
    ? `Room ${location.room_number}`
    : null;

  return (
    <header className="sticky top-0 z-40 bg-[#F8F7F3]/95 backdrop-blur-md border-b border-stone-200/60 shadow-[0_1px_8px_-2px_rgba(6,59,42,0.03)] transition-all">
      <div className="max-w-7xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Left: Navigation Menu Toggle */}
        <div className="flex items-center">
          <button
            onClick={onOpenDrawer}
            className="w-9 h-9 rounded-xl bg-white border border-stone-200/80 text-brand-950 flex items-center justify-center hover:bg-stone-50 hover:border-gold-400/60 transition-all shadow-2xs active:scale-95"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-4 h-4 text-brand-900" />
          </button>
        </div>

        {/* Center: Neat Restaurant Brand Identity */}
        <div className="flex flex-col items-center justify-center text-center max-w-[65%] sm:max-w-md">
          <Link
            href={qrToken ? `/menu/${qrToken}` : "/"}
            className="group flex items-center gap-2"
          >
            {hasLogo ? (
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-white border border-gold-500/30 flex items-center justify-center p-0.5 shadow-2xs shrink-0">
                <img
                  src={resolveImageUrl(rawLogo)}
                  alt={restaurantName}
                  className="w-full h-full object-contain"
                  onError={() => setLogoLoadFailed(true)}
                />
              </div>
            ) : (
              <span className="font-serif text-xs text-gold-500 select-none">✦</span>
            )}

            <h1 className="font-serif text-base sm:text-lg font-bold text-brand-950 tracking-tight leading-none group-hover:text-gold-600 transition-colors truncate">
              {restaurantName}
            </h1>

            {!hasLogo && (
              <span className="font-serif text-xs text-gold-500 select-none">✦</span>
            )}
          </Link>

          {tableOrRoom && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gold-700 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
              {tableOrRoom}
            </span>
          )}
        </div>

        {/* Right: Info / Live Status */}
        <div className="flex items-center gap-2">
          {/* Live Kitchen Stock Status indicator (desktop) */}
          <div
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-stone-200/80 text-[11px] font-semibold shadow-2xs"
            title={isConnected ? "Real-time kitchen stock sync active" : "Connecting to kitchen..."}
          >
            <span className="relative flex h-2 w-2">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isConnected ? "bg-emerald-500" : "bg-amber-400"
                }`}
              />
            </span>
            <span className="text-[10px] font-medium text-stone-600">
              {isConnected ? "Live" : "Sync"}
            </span>
          </div>

          {/* Concierge Info Button */}
          <button
            onClick={onOpenDrawer}
            className="w-9 h-9 rounded-xl bg-white border border-stone-200/80 text-brand-950 flex items-center justify-center hover:bg-stone-50 hover:border-gold-400/60 transition-all shadow-2xs active:scale-95"
            aria-label="Restaurant Information"
          >
            <Info className="w-4 h-4 text-brand-900" />
          </button>
        </div>
      </div>
    </header>
  );
}
