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
  // Extract tags array
  const tagsList = item.tags
    ? item.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 2)
    : [];

  return (
    <div
      onClick={() => onClick(item)}
      className="bg-white rounded-3xl border border-surface-border shadow-card hover:shadow-cardHover transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between group"
    >
      <div>
        {/* Photo Container */}
        <div className="relative aspect-[4/3] w-full bg-stone-100 overflow-hidden">
          <Image
            src={resolveImageUrl(item.image_url)}
            alt={item.name}
            fill
            className={`object-cover group-hover:scale-105 transition-transform duration-500 ${
              !item.is_available ? "grayscale-[40%]" : ""
            }`}
          />

          {/* Highlights Badge Overlay */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1 z-10">
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
            {item.is_featured && !item.is_bestseller && !item.is_popular && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-900 text-gold-300 shadow-sm">
                Chef&apos;s Pick
              </span>
            )}
          </div>

          {/* Out of Stock Overlay */}
          {!item.is_available && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20">
              <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-md">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 space-y-2">
          {/* Top row: Category tag + Prep time */}
          <div className="flex items-center justify-between text-[11px] text-text-muted">
            <span className="font-semibold text-brand-850 uppercase tracking-wider">
              {item.category_name || "Specialty"}
            </span>
            {item.preparation_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-stone-400" />
                {item.preparation_time}
              </span>
            )}
          </div>

          {/* Dish Title */}
          <h3 className="font-serif text-base sm:text-lg font-bold text-brand-950 group-hover:text-brand-800 transition-colors line-clamp-1">
            {item.name}
          </h3>

          {/* Short description */}
          <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed min-h-[32px]">
            {item.short_description || item.description || "Masterfully prepared with select seasonal ingredients."}
          </p>

          {/* Tags */}
          {tagsList.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {tagsList.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Rating & Price */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2 flex items-center justify-between border-t border-surface-border/60">
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

        <div className="text-right">
          <span className="font-serif text-lg font-bold text-brand-950">
            {formatPrice(item.price, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
