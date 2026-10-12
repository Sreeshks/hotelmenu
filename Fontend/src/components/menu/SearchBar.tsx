"use client";

import React from "react";
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";

interface SearchBarProps {
  query: string;
  onChange: (val: string) => void;
  onOpenFilter: () => void;
  activeFilterCount?: number;
  isLoading?: boolean;
}

export function SearchBar({
  query,
  onChange,
  onOpenFilter,
  activeFilterCount = 0,
  isLoading = false,
}: SearchBarProps) {
  return (
    <div className="flex items-center gap-2.5 w-full">
      {/* Search Input Box */}
      <div className="relative flex-1">
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-gold-600 animate-spin absolute left-4 top-1/2 -translate-y-1/2" />
        ) : (
          <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search for dishes, flavors, ingredients..."
          className="w-full pl-11 pr-10 py-3.5 bg-white border border-surface-border rounded-2xl text-xs sm:text-sm text-text-primary placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-800/20 focus:border-brand-800 transition-all shadow-sm"
        />
        {query && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
            aria-label="Clear Search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Options Button */}
      <button
        onClick={onOpenFilter}
        className={`relative w-12 h-12 rounded-2xl flex items-center justify-center border transition-all shadow-sm flex-shrink-0 ${
          activeFilterCount > 0
            ? "bg-brand-900 border-brand-900 text-gold-400 shadow-md"
            : "bg-white border-surface-border text-brand-900 hover:bg-stone-50"
        }`}
        aria-label="Filter Dishes"
      >
        <SlidersHorizontal className="w-5 h-5" />
        {activeFilterCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gold-500 text-brand-950 font-bold text-[10px] flex items-center justify-center border-2 border-white shadow">
            {activeFilterCount}
          </span>
        )}
      </button>
    </div>
  );
}
