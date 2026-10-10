"use client";

import React from "react";
import Link from "next/link";
import {
  X,
  Building,
  Clock,
  Phone,
  MapPin,
  Star,
  Sparkles,
  Wifi,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { RestaurantInfo as RestaurantInfoType, CustomerLocationInfo } from "@/types";

interface MoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: RestaurantInfoType;
  location?: CustomerLocationInfo | null;
  onOpenRateModal: () => void;
  qrToken?: string;
}

export function MoreDrawer({
  isOpen,
  onClose,
  restaurant,
  location,
  onOpenRateModal,
  qrToken,
}: MoreDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-start animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-950/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-left duration-300">
        <div>
          {/* Header */}
          <div className="p-6 border-b border-surface-border flex items-center justify-between bg-surface-bg/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-900 text-gold-400 font-serif font-bold text-lg flex items-center justify-center">
                H
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-brand-950 truncate max-w-[180px]">
                  {restaurant.name}
                </h3>
                <span className="text-[10px] text-gold-600 uppercase font-semibold">
                  Executive Suite
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Digital Menu banner */}
          <div className="px-6 py-3 bg-brand-50 border-b border-brand-100 flex items-center gap-2 text-xs text-brand-950">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            <span>
              <strong>Digital Culinary Menu</strong>
            </span>
          </div>

          {/* Navigation Items */}
          <div className="p-4 space-y-1">
            <button
              onClick={() => {
                onClose();
                onOpenRateModal();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gold-50/70 border border-gold-200 text-left hover:bg-gold-100/70 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-gold-600" />
                <div>
                  <span className="text-xs font-bold text-brand-950 block">
                    Rate Your Experience
                  </span>
                  <span className="text-[10px] text-text-muted">
                    Compliments for food, service & ambience
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gold-600 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {qrToken && (
              <Link
                href={`/menu/${qrToken}/reviews`}
                onClick={onClose}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl text-left hover:bg-stone-50 transition-colors text-xs font-semibold text-text-primary"
              >
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                  <span>Guest Reviews & Rating Breakdown</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </Link>
            )}

            <div className="pt-3 pb-1 border-t border-surface-border/60">
              <span className="text-[10px] uppercase font-bold text-text-muted px-3.5 tracking-wider">
                Establishment Details
              </span>
            </div>

            {/* Hours */}
            <div className="p-3.5 rounded-2xl flex items-start gap-3 text-xs">
              <Clock className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-brand-950 block">Opening Hours</span>
                <span className="text-text-muted text-[11px] leading-relaxed">
                  {restaurant.hours}
                </span>
              </div>
            </div>

            {/* Address */}
            <div className="p-3.5 rounded-2xl flex items-start gap-3 text-xs">
              <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-brand-950 block">Address</span>
                <span className="text-text-muted text-[11px] leading-relaxed">
                  {restaurant.address}, {restaurant.city}
                </span>
              </div>
            </div>

            {/* Phone */}
            <div className="p-3.5 rounded-2xl flex items-start gap-3 text-xs">
              <Phone className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-brand-950 block">Concierge Desk</span>
                <a
                  href={`tel:${restaurant.phone}`}
                  className="text-brand-850 hover:text-gold-600 text-[11px] font-semibold transition-colors"
                >
                  {restaurant.phone}
                </a>
              </div>
            </div>

            {/* Wi-Fi */}
            {restaurant.wifi_ssid && (
              <div className="p-3.5 rounded-2xl flex items-start gap-3 text-xs">
                <Wifi className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-brand-950 block">Guest Wi-Fi</span>
                  <span className="text-text-muted text-[11px] font-mono">
                    {restaurant.wifi_ssid}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-surface-border text-center space-y-1 bg-surface-bg/30">
          <p className="text-[10px] text-text-muted">
            {restaurant.name} &bull; Contactless Digital Menu
          </p>
          <p className="text-[10px] text-stone-400 font-mono">v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
