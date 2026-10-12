"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import {
  Utensils,
  Wine,
  Coffee,
  Pizza,
  Cake,
  Flame,
  Salad,
  Fish,
  Sparkles,
} from "lucide-react";
import { Category } from "@/types";
import { resolveImageUrl } from "@/lib/utils";

interface CategoryNavProps {
  categories: Category[];
  selectedCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  utensils: <Utensils className="w-6 h-6" />,
  wine: <Wine className="w-6 h-6" />,
  coffee: <Coffee className="w-6 h-6" />,
  pizza: <Pizza className="w-6 h-6" />,
  cake: <Cake className="w-6 h-6" />,
  flame: <Flame className="w-6 h-6" />,
  salad: <Salad className="w-6 h-6" />,
  fish: <Fish className="w-6 h-6" />,
};

export function CategoryNav({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});

  const getCategoryIcon = (cat: Category) => {
    if (cat.icon && ICON_MAP[cat.icon.toLowerCase()]) {
      return ICON_MAP[cat.icon.toLowerCase()];
    }
    const lower = cat.name.toLowerCase();
    if (lower.includes("wine") || lower.includes("drink") || lower.includes("beverage") || lower.includes("juice"))
      return <Wine className="w-5 h-5 sm:w-6 sm:h-6" />;
    if (lower.includes("dessert") || lower.includes("sweet") || lower.includes("cake") || lower.includes("ice"))
      return <Cake className="w-5 h-5 sm:w-6 sm:h-6" />;
    if (lower.includes("offer") || lower.includes("special") || lower.includes("popular"))
      return <Flame className="w-5 h-5 sm:w-6 sm:h-6" />;
    if (lower.includes("salad") || lower.includes("veg") || lower.includes("healthy"))
      return <Salad className="w-5 h-5 sm:w-6 sm:h-6" />;
    if (lower.includes("fish") || lower.includes("sea") || lower.includes("prawn"))
      return <Fish className="w-5 h-5 sm:w-6 sm:h-6" />;
    if (lower.includes("pizza") || lower.includes("snack") || lower.includes("burger"))
      return <Pizza className="w-5 h-5 sm:w-6 sm:h-6" />;
    if (lower.includes("coffee") || lower.includes("tea") || lower.includes("chai"))
      return <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />;
    return <Utensils className="w-5 h-5 sm:w-6 sm:h-6" />;
  };

  return (
    <div className="w-full">
      <div
        ref={scrollRef}
        className="flex items-center gap-3 sm:gap-5 overflow-x-auto py-3 px-1 no-scrollbar scroll-smooth"
      >
        {/* 'All Menu' Item */}
        <button
          onClick={() => onSelectCategory(null)}
          className="flex flex-col items-center gap-2 group flex-shrink-0 focus:outline-none active:scale-95 transition-transform"
        >
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 relative ${
              selectedCategoryId === null
                ? "bg-brand-900 text-gold-300 ring-2 ring-gold-400 ring-offset-2 ring-offset-[#F8F7F3] shadow-goldGlow scale-105"
                : "bg-white text-stone-600 border border-stone-200/80 hover:border-gold-400/50 hover:shadow-sm"
            }`}
          >
            <Sparkles className={`w-6 h-6 transition-transform group-hover:scale-110 ${selectedCategoryId === null ? "text-gold-400" : "text-stone-500"}`} />
          </div>
          <div className="flex flex-col items-center">
            <span
              className={`text-xs tracking-tight transition-colors whitespace-nowrap ${
                selectedCategoryId === null
                  ? "text-brand-950 font-bold"
                  : "text-text-secondary group-hover:text-brand-950 font-medium"
              }`}
            >
              All Menu
            </span>
            {selectedCategoryId === null && (
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-1" />
            )}
          </div>
        </button>

        {/* Dynamic Categories from backend */}
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const hasImage = !!cat.image && !imgError[cat.id];

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="flex flex-col items-center gap-2 group flex-shrink-0 focus:outline-none active:scale-95 transition-transform"
            >
              <div
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex items-center justify-center transition-all duration-300 ${
                  isSelected
                    ? "bg-brand-900 text-gold-300 ring-2 ring-gold-400 ring-offset-2 ring-offset-[#F8F7F3] shadow-goldGlow scale-105"
                    : "bg-white text-stone-600 border border-stone-200/80 hover:border-gold-400/50 hover:shadow-sm"
                }`}
              >
                {hasImage ? (
                  <Image
                    src={resolveImageUrl(cat.image)}
                    alt={cat.name}
                    fill
                    sizes="80px"
                    className={`object-cover transition-transform duration-500 group-hover:scale-110 ${
                      isSelected ? "opacity-95 contrast-110" : "opacity-85"
                    }`}
                    onError={() => setImgError((prev) => ({ ...prev, [cat.id]: true }))}
                  />
                ) : (
                  <div className={`p-3 transition-transform group-hover:scale-110 ${isSelected ? "text-gold-400" : "text-brand-900/80"}`}>
                    {getCategoryIcon(cat)}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center">
                <span
                  className={`text-xs tracking-tight whitespace-nowrap transition-colors ${
                    isSelected
                      ? "text-brand-950 font-bold"
                      : "text-text-secondary group-hover:text-brand-950 font-medium"
                  }`}
                >
                  {cat.name}
                </span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-1" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
