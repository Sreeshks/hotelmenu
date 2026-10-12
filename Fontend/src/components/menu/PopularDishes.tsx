"use client";

import React from "react";
import Image from "next/image";
import { Star, Flame, Award, ChevronRight } from "lucide-react";
import { MenuItem } from "@/types";
import { resolveImageUrl, formatPrice } from "@/lib/utils";

interface PopularDishesProps {
  items: MenuItem[];
  currency?: string;
  onSelectDish: (item: MenuItem) => void;
  onViewAllClick?: () => void;
}

export function PopularDishes({
  items,
  currency,
  onSelectDish,
  onViewAllClick,
}: PopularDishesProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-gold-500 font-serif text-xs">✦</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-gold-600">Featured Flavors</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-950 flex items-center gap-2 mt-0.5">
            <span>Popular Dishes</span>
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Most acclaimed culinary masterworks favored by our dining guests
          </p>
        </div>

        {onViewAllClick && (
          <button
            onClick={onViewAllClick}
            className="text-xs font-bold text-brand-900 hover:text-gold-600 flex items-center gap-1 group py-1.5 px-3 rounded-full bg-white border border-stone-200/80 hover:border-gold-400 transition-all shadow-2xs"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-gold-600" />
          </button>
        )}
      </div>

      {/* Horizontal Scroll Cards Carousel */}
      <div className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {items.map((item) => {
          const isVeg = item.is_vegetarian ?? (item.tags?.toLowerCase().includes("veg") && !item.tags?.toLowerCase().includes("non"));

          return (
            <div
              key={item.id}
              onClick={() => onSelectDish(item)}
              className="w-64 sm:w-72 flex-shrink-0 bg-white rounded-3xl border border-stone-200/80 shadow-card hover:shadow-cardHover hover:border-gold-400/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
            >
              <div>
                {/* Photo Box with Badges */}
                <div className="relative aspect-[4/3] w-full bg-stone-100 overflow-hidden">
                  <Image
                    src={resolveImageUrl(item.image_url)}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 256px, 288px"
                    className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                  />

                  {/* Top Left Badge Overlay */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1 z-10">
                    {item.is_bestseller && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-gold-500 to-gold-400 text-brand-950 shadow-sm flex items-center gap-1">
                        <Award className="w-3 h-3 text-brand-950" />
                        Bestseller
                      </span>
                    )}
                    {item.is_popular && !item.is_bestseller && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-950/85 backdrop-blur-sm text-gold-300 shadow-sm flex items-center gap-1 border border-gold-400/30">
                        <Flame className="w-3 h-3 text-gold-400" />
                        Popular
                      </span>
                    )}
                  </div>

                  {/* Top Right Dietary Badge */}
                  <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm p-1 rounded-md shadow-2xs">
                    <span className={isVeg ? "diet-badge-veg w-4 h-4" : "diet-badge-nonveg w-4 h-4"} />
                  </div>

                  {/* Live Stock Overlay */}
                  {!item.is_available && (
                    <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-[2px] flex items-center justify-center z-20">
                      <span className="px-3 py-1 rounded-full bg-stone-800 text-gold-300 font-bold text-xs uppercase tracking-wider border border-gold-400/40 shadow-md">
                        Sold Out Today
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-gold-600">
                      <Star className="w-3.5 h-3.5 fill-gold-500 text-gold-500" />
                      <span className="text-xs font-bold text-brand-950">
                        {item.rating > 0 ? item.rating.toFixed(1) : "5.0"}
                      </span>
                      {item.review_count > 0 && (
                        <span className="text-[11px] text-text-muted">
                          ({item.review_count})
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] uppercase font-bold tracking-wider text-gold-600 bg-gold-50 px-2 py-0.5 rounded-md border border-gold-200/60">
                      {item.category_name || "Specialty"}
                    </span>
                  </div>

                  <h3 className="font-serif text-base font-bold text-brand-950 group-hover:text-gold-600 transition-colors truncate">
                    {item.name}
                  </h3>

                  <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                    {item.short_description || item.description || "Freshly crafted with authentic ingredients."}
                  </p>
                </div>
              </div>

              {/* Price Footer */}
              <div className="px-4 sm:px-5 pb-4 pt-1 flex items-center justify-between border-t border-stone-100">
                <span className="font-serif text-lg font-bold text-brand-950">
                  {formatPrice(item.price, currency)}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-brand-900 group-hover:text-gold-600 bg-stone-50 group-hover:bg-brand-900 group-hover:text-gold-300 px-2.5 py-1 rounded-xl border border-stone-200 group-hover:border-brand-900 transition-all duration-200 flex items-center gap-1">
                    <span>Details</span>
                    <span className="text-xs">&rarr;</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
