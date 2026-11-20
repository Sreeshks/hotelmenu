"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Flame, Clock, Sparkles, Plus, Minus, Calendar, Gift, ArrowRight } from "lucide-react";
import { MenuItem } from "@/types";
import { resolveImageUrl, formatPrice } from "@/lib/utils";
import { useCart } from "@/components/cart/CartContext";

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface DailyOffersSectionProps {
  allItems: MenuItem[];
  todayDayName?: string;
  currency?: string;
  onItemClick: (item: MenuItem) => void;
}

export function DailyOffersSection({
  allItems,
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

  const [selectedDay, setSelectedDay] = useState<string>("Today");
  const { addToCart, updateQuantity, getItemQuantity, config } = useCart();

  // All items with an active daily offer
  const allDailyOfferItems = useMemo(() => {
    return allItems.filter((i) => i.is_daily_offer || (i.original_price && i.original_price > i.price));
  }, [allItems]);

  // If no items have daily offers or special prices, do not render this section
  if (allDailyOfferItems.length === 0) {
    return null;
  }

  // Filter items for the chosen day
  const displayedItems = useMemo(() => {
    const targetDay = selectedDay === "Today" ? currentDay : selectedDay;

    if (selectedDay === "All") {
      return allDailyOfferItems;
    }

    return allDailyOfferItems.filter((item) => {
      // If item has offer_days, match against selected day
      if (item.offer_days) {
        const days = item.offer_days.toLowerCase();
        return days.includes("all") || days.includes("daily") || days.includes(targetDay.toLowerCase());
      }
      // If it's a general offer (has original_price discount), include it
      return selectedDay === "Today" || selectedDay === "All";
    });
  }, [allDailyOfferItems, selectedDay, currentDay]);

  const activeDayLabel = selectedDay === "Today" ? currentDay : selectedDay;

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 text-white flex items-center justify-center shadow-md animate-pulse">
              <Flame className="w-4 h-4 fill-white" />
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-950">
              {selectedDay === "Today" ? `Today's ${currentDay} Specials` : `${selectedDay} Special Offers`}
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Exclusive promotional prices available for {activeDayLabel} dining
          </p>
        </div>

        {/* Day Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedDay("Today")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedDay === "Today"
                ? "bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-sm"
                : "bg-white text-stone-600 border border-stone-200 hover:border-gold-400"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Today ({currentDay})</span>
          </button>

          {WEEKDAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedDay === day
                  ? "bg-brand-950 text-gold-400 font-bold shadow-xs"
                  : "bg-white text-stone-600 border border-stone-200 hover:border-brand-700"
              }`}
            >
              {day}
            </button>
          ))}

          <button
            onClick={() => setSelectedDay("All")}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDay === "All"
                ? "bg-brand-950 text-gold-400 font-bold shadow-xs"
                : "bg-white text-stone-600 border border-stone-200"
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Offers Horizontal Cards Reel / Grid */}
      {displayedItems.length === 0 ? (
        <div className="p-8 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-center space-y-2">
          <Flame className="w-8 h-8 text-amber-500 mx-auto opacity-70" />
          <p className="text-xs font-bold text-amber-950">
            No specific offers scheduled for {activeDayLabel}
          </p>
          <button
            onClick={() => setSelectedDay("Today")}
            className="text-xs font-semibold text-amber-700 hover:underline"
          >
            Switch to Today&apos;s Specials ({currentDay}) &rarr;
          </button>
        </div>
      ) : (
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
                    {item.offer_days ? `${item.offer_days.split(",")[0]} Deal` : "Daily Special"}
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
      )}
    </section>
  );
}
