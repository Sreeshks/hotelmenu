"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, Info, MapPin, Sparkles, Wifi } from "lucide-react";
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

  return (
    <header className="sticky top-0 z-40 bg-[#F8F7F3]/95 backdrop-blur-md border-b border-surface-border/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Menu Drawer Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenDrawer}
            className="w-10 h-10 rounded-xl bg-white border border-surface-border text-brand-950 flex items-center justify-center hover:bg-stone-50 transition-colors shadow-sm"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 text-brand-900" />
          </button>
        </div>

        {/* Center: Restaurant Crest & Name */}
        <div className="flex flex-col items-center text-center">
          <Link
            href={qrToken ? `/menu/${qrToken}` : "/"}
            className="group flex flex-col items-center"
          >
            <div className="flex items-center gap-2">
              {hasLogo ? (
                <div className="w-8 h-8 rounded-xl overflow-hidden bg-white border border-stone-200/80 flex items-center justify-center p-0.5 shadow-2xs flex-shrink-0">
                  <img
                    src={resolveImageUrl(rawLogo)}
                    alt={restaurantName}
                    className="w-full h-full object-contain"
                    onError={() => setLogoLoadFailed(true)}
                  />
                </div>
              ) : (
                <span className="font-serif font-black text-xs text-gold-600 tracking-wider">✦</span>
              )}
              <h1 className="font-serif text-base sm:text-lg font-bold text-brand-950 tracking-tight leading-none group-hover:text-brand-800 transition-colors">
                {restaurantName}
              </h1>
              {!hasLogo && (
                <span className="font-serif font-black text-xs text-gold-600 tracking-wider">✦</span>
              )}
            </div>

            {/* Digital Menu Pill */}
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-850 mt-1 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-100">
              <Sparkles className="w-3 h-3 text-gold-600" />
              <span>Digital Culinary Menu</span>
            </div>
          </Link>
        </div>

        {/* Right: Live Kitchen Indicator & Info/Rate button */}
        <div className="flex items-center gap-2">
          {/* Real-time stock status badge */}
          <div
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-surface-border text-[11px] font-semibold text-stone-600 shadow-sm"
            title={isConnected ? "Real-time stock synchronized with kitchen" : "Connecting to kitchen..."}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className="text-[10px] font-medium text-stone-500">Live Stock</span>
          </div>

          {/* Rate / Info trigger */}
          <button
            onClick={onOpenDrawer}
            className="w-10 h-10 rounded-xl bg-white border border-surface-border text-brand-950 flex items-center justify-center hover:bg-stone-50 transition-colors shadow-sm"
            aria-label="Restaurant Information"
          >
            <Info className="w-4 h-4 text-brand-900" />
          </button>
        </div>
      </div>
    </header>
  );
}
