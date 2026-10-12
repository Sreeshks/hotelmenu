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
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-950 flex items-center gap-2">
            <span>Popular Dishes</span>
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Most acclaimed selections favored by our dining guests
          </p>
        </div>

        {onViewAllClick && (
          <button
            onClick={onViewAllClick}
            className="text-xs font-semibold text-brand-900 hover:text-brand-700 flex items-center gap-1 group"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Horizontal Scroll Cards Carousel */}
      <div className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectDish(item)}
            className="w-64 sm:w-72 flex-shrink-0 bg-white rounded-3xl border border-surface-border shadow-card hover:shadow-cardHover transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between group"
          >
            <div>
              {/* Photo Box with Badges */}
              <div className="relative aspect-[4/3] w-full bg-stone-100 overflow-hidden">
                <Image
                  src={resolveImageUrl(item.image_url)}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 256px, 288px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Badge Overlay */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                  {item.is_bestseller && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold-500 text-brand-950 shadow-sm flex items-center gap-1">
                      <Award className="w-3 h-3 text-brand-950" />
                      Bestseller
                    </span>
                  )}
                  {item.is_popular && !item.is_bestseller && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-950/80 backdrop-blur-sm text-gold-300 shadow-sm flex items-center gap-1">
                      <Flame className="w-3 h-3 text-gold-400" />
                      Popular
                    </span>
                  )}
                </div>

                {/* Live Stock Overlay */}
                {!item.is_available && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-md">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-1.5">
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

                <h3 className="font-serif text-base font-bold text-brand-950 group-hover:text-brand-800 transition-colors truncate">
                  {item.name}
                </h3>

                <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                  {item.short_description || item.description || "Freshly crafted recipe."}
                </p>
              </div>
            </div>

            {/* Price Footer */}
            <div className="px-4 pb-4 pt-1 flex items-center justify-between border-t border-surface-border/60">
              <span className="font-serif text-lg font-bold text-brand-950">
                {formatPrice(item.price, currency)}
              </span>

              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    item.is_available
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-rose-700 bg-rose-50"
                  }`}
                >
                  {item.is_available ? "In Stock" : "Unavailable"}
                </span>
                <span className="text-[10px] font-semibold text-brand-850 bg-brand-50 group-hover:bg-brand-900 group-hover:text-white px-1.5 py-0.5 rounded-md border border-brand-100 transition-colors">
                  Details &rarr;
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
