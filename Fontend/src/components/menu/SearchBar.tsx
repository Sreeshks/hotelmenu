"use client";

import React from "react";
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";

interface SearchBarProps {
  query: string;
  onChange: (val: string) => void;
  onOpenFilter: () => void;
  activeFilterCount?: number;
  isLoading?: boolean;
  onQuickFilter?: (filterType: "veg" | "bestseller" | "popular" | "topRated" | "all") => void;
  activeQuickFilter?: string | null;
}

const QUICK_FILTERS = [
  { id: "all", label: "All Items", icon: "✦" },
  { id: "veg", label: "Vegetarian", icon: "🌿" },
  { id: "bestseller", label: "Bestsellers", icon: "⭐" },
  { id: "popular", label: "Popular", icon: "🔥" },
  { id: "topRated", label: "Top Rated", icon: "✨" },
];

export function SearchBar({
  query,
  onChange,
  onOpenFilter,
  activeFilterCount = 0,
  isLoading = false,
  onQuickFilter,
  activeQuickFilter,
}: SearchBarProps) {
  return (
    <div className="space-y-3 w-full">
      {/* Search Input Box & Filter Button */}
      <div className="flex items-center gap-2.5 w-full">
        <div className="relative flex-1 group">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-gold-600 animate-spin absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          ) : (
            <Search className="w-4 h-4 text-stone-400 group-focus-within:text-gold-600 transition-colors absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          )}

          <input
            id="menu-search-input"
            type="text"
            value={query}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search dishes, flavors, ingredients..."
            className="w-full pl-11 pr-10 py-3.5 bg-white border border-stone-200/90 rounded-2xl text-xs sm:text-sm text-text-primary placeholder:text-stone-400 focus:outline-none focus:border-gold-500 focus:ring-4 focus:ring-gold-400/20 transition-all duration-200 shadow-sm hover:border-stone-300"
          />

          {query && (
            <button
              onClick={() => onChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors"
              aria-label="Clear Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Trigger Button */}
        <button
          onClick={onOpenFilter}
          className={`relative w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-200 shadow-sm flex-shrink-0 active:scale-95 ${
            activeFilterCount > 0
              ? "bg-brand-900 border-brand-900 text-gold-400 shadow-goldGlow ring-2 ring-gold-400/40"
              : "bg-white border-stone-200/90 text-brand-900 hover:bg-stone-50 hover:border-gold-400/60"
          }`}
          aria-label="Filter Dishes"
        >
          <SlidersHorizontal className="w-5 h-5" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-gold-500 text-brand-950 font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-sm">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Quick Filter Horizontal Pills (Instant 1-tap filtering) */}
      {onQuickFilter && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {QUICK_FILTERS.map((f) => {
            const isActive = activeQuickFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onQuickFilter(f.id as any)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 shadow-2xs ${
                  isActive
                    ? "bg-brand-900 text-gold-300 border border-gold-500/50 shadow-sm"
                    : "bg-white text-stone-600 border border-stone-200/80 hover:border-gold-400/50 hover:text-brand-950"
                }`}
              >
                <span className="text-xs">{f.icon}</span>
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
