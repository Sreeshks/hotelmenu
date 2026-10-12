"use client";

import React, { useState } from "react";
import { Building, MapPin, Phone, Clock, Wifi, Award } from "lucide-react";
import { RestaurantInfo as RestaurantInfoType } from "@/types";
import { resolveImageUrl } from "@/lib/utils";

interface RestaurantInfoProps {
  restaurant: RestaurantInfoType;
}

export function RestaurantInfo({ restaurant }: RestaurantInfoProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = !!restaurant.logo_url && !logoFailed;

  return (
    <section className="bg-white rounded-3xl border border-surface-border p-6 sm:p-8 shadow-card space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-surface-border">
        {/* Brand Crest & Info */}
        <div className="flex items-center gap-4">
          {showLogo ? (
            <div className="w-14 h-14 rounded-2xl bg-white border border-surface-border p-1.5 flex items-center justify-center shadow-md flex-shrink-0">
              <img
                src={resolveImageUrl(restaurant.logo_url)}
                alt={restaurant.name}
                className="w-full h-full object-contain"
                onError={() => setLogoFailed(true)}
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-brand-900 border-2 border-gold-400/40 text-gold-400 font-serif font-bold text-2xl flex items-center justify-center shadow-md flex-shrink-0">
              H
            </div>
          )}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gold-600">
              Hospitality & Gastronomy
            </span>
            <h3 className="font-serif text-2xl font-bold text-brand-950">
              {restaurant.name}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">{restaurant.tagline}</p>
          </div>
        </div>

        {/* Wi-Fi Pill */}
        {restaurant.wifi_ssid && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gold-50/70 border border-gold-200 self-start md:self-auto">
            <Wifi className="w-4 h-4 text-gold-600" />
            <div className="text-xs">
              <span className="text-text-muted block text-[10px] uppercase font-semibold">
                Guest Wi-Fi
              </span>
              <span className="font-bold text-brand-950">{restaurant.wifi_ssid}</span>
            </div>
          </div>
        )}
      </div>

      {/* Info Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Address */}
        <div className="p-4 rounded-2xl bg-surface-bg/60 border border-surface-border flex items-start gap-3">
          <MapPin className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-text-muted uppercase text-[10px] block">
              Location
            </span>
            <span className="font-bold text-brand-950 block mt-0.5">
              {restaurant.address}
            </span>
            <span className="text-text-secondary">{restaurant.city}</span>
          </div>
        </div>

        {/* Timings */}
        <div className="p-4 rounded-2xl bg-surface-bg/60 border border-surface-border flex items-start gap-3">
          <Clock className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-text-muted uppercase text-[10px] block">
              Service Hours
            </span>
            <span className="font-bold text-brand-950 block mt-0.5">
              {restaurant.hours}
            </span>
            <span className="text-text-secondary">Breakfast • Lunch • Dinner</span>
          </div>
        </div>

        {/* Direct Contact */}
        <div className="p-4 rounded-2xl bg-surface-bg/60 border border-surface-border flex items-start gap-3">
          <Phone className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-text-muted uppercase text-[10px] block">
              Concierge / Dining
            </span>
            <a
              href={`tel:${restaurant.phone}`}
              className="font-bold text-brand-950 hover:text-gold-600 block mt-0.5 transition-colors"
            >
              {restaurant.phone}
            </a>
            <span className="text-text-secondary">Direct Table Line</span>
          </div>
        </div>
      </div>
    </section>
  );
}
