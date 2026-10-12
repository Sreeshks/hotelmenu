"use client";

import React from "react";
import Image from "next/image";
import { Star, Flame, Award, Clock, Sparkles } from "lucide-react";
import { MenuItem } from "@/types";
import { resolveImageUrl, formatPrice } from "@/lib/utils";

interface MenuCardProps {
  item: MenuItem;
  currency?: string;
  onClick: (item: MenuItem) => void;
}

export function MenuCard({ item, currency, onClick }: MenuCardProps) {
  const [imgError, setImgError] = React.useState(false);

  // Extract tags array
  const tagsList = item.tags
    ? item.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 2)
    : [];

  const isVeg = item.is_vegetarian ?? (item.tags?.toLowerCase().includes("veg") && !item.tags?.toLowerCase().includes("non"));

  return (
    <div
      onClick={() => onClick(item)}
      className="bg-white rounded-3xl border border-stone-200/80 shadow-card hover:shadow-cardHover hover:border-gold-400/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
    >
      <div>
        {/* Photo Container */}
        <div className="relative aspect-[16/11] sm:aspect-[4/3] w-full bg-stone-100 overflow-hidden">
          {!imgError ? (
            <Image
              src={resolveImageUrl(item.image_url)}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
              className={`object-cover group-hover:scale-108 transition-transform duration-700 ease-out ${
                !item.is_available ? "grayscale-[40%]" : ""
              }`}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-stone-100 flex items-center justify-center text-stone-400">
              <span className="font-serif text-xs italic">Culinary Selection</span>
            </div>
          )}

          {/* Highlights Badge Overlay (Top Left) */}
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
            {item.is_featured && !item.is_bestseller && !item.is_popular && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-900 text-gold-300 shadow-sm border border-gold-400/30">
                Chef&apos;s Pick
              </span>
            )}
          </div>

          {/* Dietary Badge (Top Right) */}
          <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm p-1 rounded-md shadow-2xs">
            <span className={isVeg ? "diet-badge-veg w-4 h-4" : "diet-badge-nonveg w-4 h-4"} />
          </div>

          {/* Out of Stock Overlay */}
          {!item.is_available && (
            <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-[2px] flex items-center justify-center z-20">
              <span className="px-3 py-1 rounded-full bg-stone-800 text-gold-300 font-bold text-xs uppercase tracking-wider border border-gold-400/40 shadow-md">
                Sold Out Today
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 space-y-2">
          {/* Top row: Category tag + Prep time */}
          <div className="flex items-center justify-between text-[11px] text-text-muted">
            <span className="font-bold text-gold-600 uppercase tracking-widest text-[10px]">
              {item.category_name || "Specialty"}
            </span>
            {item.preparation_time && (
              <span className="flex items-center gap-1 text-stone-500 font-medium">
                <Clock className="w-3 h-3 text-gold-600" />
                {item.preparation_time}
              </span>
            )}
          </div>

          {/* Dish Title */}
          <h3 className="font-serif text-base sm:text-lg font-bold text-brand-950 group-hover:text-gold-600 transition-colors line-clamp-1">
            {item.name}
          </h3>

          {/* Short description */}
          <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed min-h-[32px]">
            {item.short_description || item.description || "Masterfully prepared with select seasonal ingredients."}
          </p>

          {/* Tags & Calories */}
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            {item.calories && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-medium border border-amber-200/60">
                🔥 {item.calories} kcal
              </span>
            )}
            {tagsList.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Card Footer: Rating & Price */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2.5 flex items-center justify-between border-t border-stone-100">
        <div className="flex items-center gap-1">
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

        <div className="flex items-center gap-2">
          <span className="font-serif text-lg font-bold text-brand-950">
            {formatPrice(item.price, currency)}
          </span>
          <span className="inline-flex text-[11px] font-bold text-brand-900 group-hover:text-gold-600 bg-stone-50 group-hover:bg-brand-900 group-hover:text-gold-300 px-2.5 py-1 rounded-xl border border-stone-200 group-hover:border-brand-900 transition-all duration-200">
            Details &rarr;
          </span>
        </div>
      </div>
    </div>
  );
}
