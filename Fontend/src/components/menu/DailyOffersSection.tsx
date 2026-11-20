"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { Flame, Plus, Minus } from "lucide-react";
import { MenuItem } from "@/types";
import { resolveImageUrl, formatPrice } from "@/lib/utils";
import { useCart } from "@/components/cart/CartContext";

interface DailyOffersSectionProps {
  allItems?: MenuItem[];
  todayOffers?: MenuItem[];
  todayDayName?: string;
  currency?: string;
  onItemClick: (item: MenuItem) => void;
}

export function DailyOffersSection({
  allItems = [],
  todayOffers = [],
  todayDayName: initialDay,
  currency,
  onItemClick,
}: DailyOffersSectionProps) {
  // Determine current day of week if not provided
  const currentDay = useMemo(() => {
    if (initialDay) return initialDay;
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date().getDay()];
  }, [initialDay]);

  const { addToCart, updateQuantity, getItemQuantity, config } = useCart();

  // Filter items specifically for today only
  const displayedItems = useMemo(() => {
    const todayLower = currentDay.toLowerCase();
    const itemsMap = new Map<number, MenuItem>();

    // 1. Items directly returned by backend as today_offers
    if (todayOffers && todayOffers.length > 0) {
      todayOffers.forEach((item) => itemsMap.set(item.id, item));
    }

    // 2. Any item from allItems flagged as is_daily_offer matching today
    if (allItems && allItems.length > 0) {
      allItems.forEach((item) => {
        if (item.is_daily_offer && item.offer_days) {
          const days = item.offer_days.toLowerCase();
          if (days.includes("all") || days.includes("daily") || days.includes(todayLower)) {
            itemsMap.set(item.id, item);
          }
        }
      });
    }

    return Array.from(itemsMap.values());
  }, [allItems, todayOffers, currentDay]);

  // If there are no specials for today, don't display the section
  if (displayedItems.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      {/* Section Header - Only Today Special on the left */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 text-white flex items-center justify-center shadow-md animate-pulse shrink-0">
          <Flame className="w-4 h-4 fill-white" />
        </div>
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-950">
            Today ({currentDay}) Special
          </h2>
          <p className="text-xs text-stone-500">
            Exclusive specials available for {currentDay}
          </p>
        </div>
      </div>

      {/* Offers Horizontal Cards Reel / Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedItems.map((item) => {
          const hasDiscount = Boolean(item.original_price && item.original_price > item.price);
          const discountPercent = hasDiscount
            ? Math.round(((item.original_price! - item.price) / item.original_price!) * 100)
            : 0;
          const cartQty = getItemQuantity(item.id);

          return (
            <div
              key={item.id}
              onClick={() => onItemClick(item)}
              className="bg-white rounded-3xl border border-amber-200/80 hover:border-gold-500 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between group relative"
            >
              {/* Offer Ribbon Banner */}
              <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 px-3.5 py-1 text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-white" />
                  {`${currentDay} Special`}
                </span>
                {hasDiscount && <span>Save {discountPercent}%</span>}
              </div>

              <div className="p-4 flex gap-3">
                {/* Photo */}
                <div className="relative w-20 h-20 rounded-2xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                  {item.image_url ? (
                    <Image
                      src={resolveImageUrl(item.image_url)}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400 font-serif text-[10px]">
                      Dish
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-gold-600 uppercase tracking-widest block">
                    {item.category_name || "Special"}
                  </span>
                  <h3 className="font-serif text-sm font-bold text-brand-950 truncate group-hover:text-gold-600 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                    {item.short_description || item.description || "Freshly prepared daily special."}
                  </p>

                  <div className="flex items-baseline gap-2 mt-2">
                    {hasDiscount && (
                      <span className="text-xs text-stone-400 line-through font-serif">
                        {formatPrice(item.original_price!, currency)}
                      </span>
                    )}
                    <span className="font-serif text-base font-bold text-rose-700">
                      {formatPrice(item.price, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Bottom: WhatsApp Order Button or Stepper */}
              <div className="px-4 pb-3 pt-1 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[10px] text-stone-400">
                  {item.preparation_time ? `⏱️ ${item.preparation_time}` : "Special Offer"}
                </span>

                {config.onlineOrderingEnabled && item.is_available ? (
                  cartQty > 0 ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-xl shadow-2xs"
                    >
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-5 h-5 rounded-md bg-white text-emerald-800 flex items-center justify-center font-bold text-xs shadow-2xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-emerald-900 w-4 text-center">
                        {cartQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(item, 1);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 px-3 py-1.5 rounded-xl shadow-xs transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add &bull; {formatPrice(item.price, currency)}</span>
                    </button>
                  )
                ) : (
                  <span className="text-[11px] font-bold text-brand-900 group-hover:text-gold-600">
                    View Dish &rarr;
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
