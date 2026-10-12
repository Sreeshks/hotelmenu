"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, Info, MapPin, Sparkles } from "lucide-react";
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
  onOpenRate,
  qrToken,
}: HeaderProps) {
  const { isConnected } = useCustomerWebSocket();
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  const restaurantName = restaurant?.name || "Grand Hotel & Dining";
  const rawLogo = location?.logo_url || restaurant?.logo_url;
  const hasLogo = !!rawLogo && !logoLoadFailed;

  const tableOrRoom = location?.table_number
    ? `Table ${location.table_number}`
    : location?.room_number
    ? `Room ${location.room_number}`
    : location?.name || null;

  return (
    <header className="sticky top-0 z-40 bg-[#F8F7F3]/90 backdrop-blur-xl border-b border-stone-200/70 transition-all shadow-[0_2px_15px_-3px_rgba(6,59,42,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-[70px] flex items-center justify-between gap-3">
        {/* Left: Navigation Menu Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDrawer}
            className="w-10 h-10 rounded-2xl bg-white border border-stone-200/80 text-brand-950 flex items-center justify-center hover:bg-stone-50 hover:border-gold-400/60 transition-all duration-200 shadow-sm active:scale-95 group"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 text-brand-900 group-hover:text-gold-600 transition-colors" />
          </button>
        </div>

        {/* Center: Restaurant Crest & Identity */}
        <div className="flex flex-col items-center text-center max-w-[65%] sm:max-w-md">
          {tableOrRoom && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold-50/90 border border-gold-300/60 text-[10px] font-semibold text-gold-700 tracking-wide mb-0.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
              <span>{tableOrRoom}</span>
            </div>
          )}

          <Link
            href={qrToken ? `/menu/${qrToken}` : "/"}
            className="group flex flex-col items-center"
          >
            <div className="flex items-center gap-2">
              {hasLogo ? (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl overflow-hidden bg-white border border-gold-500/30 flex items-center justify-center p-0.5 shadow-2xs flex-shrink-0 group-hover:border-gold-500 transition-colors">
                  <img
                    src={resolveImageUrl(rawLogo)}
                    alt={restaurantName}
                    className="w-full h-full object-contain"
                    onError={() => setLogoLoadFailed(true)}
                  />
                </div>
              ) : (
                <span className="font-serif text-xs text-gold-500 tracking-wider">✦</span>
              )}
              <h1 className="font-serif text-base sm:text-lg font-bold text-brand-950 tracking-tight leading-none group-hover:text-gold-600 transition-colors truncate">
                {restaurantName}
              </h1>
              {!hasLogo && (
                <span className="font-serif text-xs text-gold-500 tracking-wider">✦</span>
              )}
            </div>

            {/* Digital Culinary Menu Subtitle Pill */}
            {!tableOrRoom && (
              <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-850 mt-0.5 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-100/80">
                <Sparkles className="w-2.5 h-2.5 text-gold-600" />
                <span className="tracking-wide">Digital Culinary Menu</span>
              </div>
            )}
          </Link>
        </div>

        {/* Right: Live Kitchen Indicator & Drawer / Concierge */}
        <div className="flex items-center gap-2">
          {/* Live Kitchen Stock Status indicator */}
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
              {isConnected ? "Kitchen Live" : "Syncing"}
            </span>
          </div>

          {/* Concierge Info Button */}
          <button
            onClick={onOpenDrawer}
            className="w-10 h-10 rounded-2xl bg-white border border-stone-200/80 text-brand-950 flex items-center justify-center hover:bg-stone-50 hover:border-gold-400/60 transition-all duration-200 shadow-sm active:scale-95 group"
            aria-label="Restaurant Information & Concierge"
          >
            <Info className="w-4 h-4 text-brand-900 group-hover:text-gold-600 transition-colors" />
          </button>
        </div>
      </div>
    </header>
  );
}
