"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import {
  Search,
  X,
  Star,
  Award,
  Flame,
  ChevronRight,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { MenuItem, Category } from "@/types";
import { resolveImageUrl, formatPrice } from "@/lib/utils";

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
  categories?: Category[];
  currency?: string;
  onSelectItem: (item: MenuItem) => void;
  onApplySearchToMenu?: (query: string, categoryId?: number | null) => void;
  initialQuery?: string;
}

const QUICK_FILTERS = [
  { id: "all", label: "All", icon: "✦" },
  { id: "veg", label: "Vegetarian", icon: "🌿" },
  { id: "bestseller", label: "Bestsellers", icon: "⭐" },
  { id: "popular", label: "Popular", icon: "🔥" },
  { id: "topRated", label: "Top Rated", icon: "✨" },
];

export function MobileSearchModal({
  isOpen,
  onClose,
  items = [],
  categories = [],
  currency,
  onSelectItem,
  onApplySearchToMenu,
  initialQuery = "",
}: MobileSearchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [quickFilter, setQuickFilter] = useState<string>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initial query when opened
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      // Auto-focus input after smooth slide-in
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialQuery]);

  // Lock background body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Filter items based on query, category, and quick filter
  const filteredItems = useMemo(() => {
    let result = items;

    // Filter by Category
    if (selectedCatId !== null) {
      result = result.filter((item) => item.category_id === selectedCatId);
    }

    // Filter by Search Query
    const cleanQuery = query.trim().toLowerCase();
    if (cleanQuery.length > 0) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(cleanQuery) ||
          item.description?.toLowerCase().includes(cleanQuery) ||
          item.short_description?.toLowerCase().includes(cleanQuery) ||
          item.tags?.toLowerCase().includes(cleanQuery) ||
          item.category_name?.toLowerCase().includes(cleanQuery)
      );
    }

    // Quick filter
    if (quickFilter === "veg") {
      result = result.filter(
        (item) =>
          item.is_vegetarian ||
          (item.tags?.toLowerCase().includes("veg") && !item.tags?.toLowerCase().includes("non"))
      );
    } else if (quickFilter === "bestseller") {
      result = result.filter((item) => item.is_bestseller);
    } else if (quickFilter === "popular") {
      result = result.filter((item) => item.is_popular);
    } else if (quickFilter === "topRated") {
      result = result.filter((item) => (item.rating || 0) >= 4.5);
    }

    return result;
  }, [items, query, selectedCatId, quickFilter]);

  // Popular items to show when no search is active
  const popularSuggestions = useMemo(() => {
    return items.filter((i) => i.is_bestseller || i.is_popular || (i.rating || 0) >= 4.5).slice(0, 6);
  }, [items]);

  const hasActiveFilters = query.trim().length > 0 || selectedCatId !== null || quickFilter !== "all";

  const handleApplyToMenu = () => {
    if (onApplySearchToMenu) {
      onApplySearchToMenu(query, selectedCatId);
    }
    onClose();
  };

  const handleClear = () => {
    setQuery("");
    setSelectedCatId(null);
    setQuickFilter("all");
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end animate-in fade-in duration-200">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-brand-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet Container */}
      <div className="relative w-full max-w-lg mx-auto bg-[#F8F7F3] rounded-t-[32px] shadow-2xl flex flex-col max-h-[90vh] z-10 animate-in slide-in-from-bottom duration-300 border-t border-stone-200/90 overflow-hidden">
        {/* Top Handle / Drag indicator */}
        <div className="pt-3 pb-1 flex justify-center cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
        </div>

        {/* Header Bar */}
        <div className="px-5 py-2.5 flex items-center justify-between border-b border-stone-200/60 bg-white/70 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-900 flex items-center justify-center shadow-2xs">
              <Search className="w-4 h-4 text-brand-900 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-serif font-bold text-brand-950 leading-tight">
                Search Menu
              </h2>
              <p className="text-[11px] text-stone-500">
                {items.length} dishes available
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors active:scale-90"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thumb-Zone Search Input */}
        <div className="p-4 bg-white border-b border-stone-200/80 shadow-xs space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes, flavors, ingredients..."
              className="w-full pl-11 pr-10 py-3.5 bg-stone-50 border border-stone-200/90 rounded-2xl text-xs sm:text-sm text-text-primary placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-gold-500 focus:ring-4 focus:ring-gold-400/20 transition-all duration-200"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 flex items-center justify-center transition-colors"
                aria-label="Clear text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {QUICK_FILTERS.map((f) => {
              const isActive = quickFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setQuickFilter(f.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                    isActive
                      ? "bg-brand-900 text-gold-300 border border-gold-500/50 shadow-xs"
                      : "bg-stone-100 text-stone-600 border border-stone-200/60 hover:text-stone-900"
                  }`}
                >
                  <span className="text-xs">{f.icon}</span>
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* Categories Horizontal Scroll */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
              <button
                onClick={() => setSelectedCatId(null)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  selectedCatId === null
                    ? "bg-stone-800 text-white shadow-2xs"
                    : "bg-white text-stone-500 border border-stone-200 hover:border-stone-400"
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => {
                const isSelected = selectedCatId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCatId(isSelected ? null : cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                      isSelected
                        ? "bg-brand-900 text-gold-300 border border-gold-400 shadow-2xs"
                        : "bg-white text-stone-600 border border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Results List Section */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 overscroll-contain">
          {hasActiveFilters ? (
            <>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-stone-500">
                  {filteredItems.length === 1
                    ? "1 dish found"
                    : `${filteredItems.length} dishes found`}
                </span>
                <button
                  onClick={handleClear}
                  className="text-xs text-brand-900 hover:text-gold-600 font-medium underline"
                >
                  Reset filters
                </button>
              </div>

              {filteredItems.length === 0 ? (
                <div className="py-12 text-center space-y-3 bg-white rounded-2xl border border-stone-200/80 p-6">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                    <UtensilsCrossed className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-stone-800 text-sm">
                      No matching dishes
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                      We couldn&apos;t find anything for &quot;{query}&quot;. Try another ingredient or clear filters.
                    </p>
                  </div>
                  <button
                    onClick={handleClear}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-900 text-white rounded-xl text-xs font-semibold hover:bg-brand-950 transition-colors shadow-xs"
                  >
                    View All Dishes
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map((item) => (
                    <ProductSearchResultRow
                      key={item.id}
                      item={item}
                      currency={currency}
                      onClick={() => onSelectItem(item)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* No query typed yet: Show Trending / Popular Suggestions */}
              <div className="px-1 pt-1 flex items-center gap-1.5 text-xs font-bold text-brand-950 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                <span>Popular Recommendations</span>
              </div>

              <div className="space-y-2">
                {popularSuggestions.map((item) => (
                  <ProductSearchResultRow
                    key={item.id}
                    item={item}
                    currency={currency}
                    onClick={() => onSelectItem(item)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bottom Action Footer */}
        {hasActiveFilters && filteredItems.length > 0 && onApplySearchToMenu && (
          <div className="p-3 bg-white border-t border-stone-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] pb-safe">
            <button
              onClick={handleApplyToMenu}
              className="w-full py-3 px-4 bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
            >
              <span>View {filteredItems.length} dishes in Menu</span>
              <ChevronRight className="w-4 h-4 text-gold-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Individual Mobile Product Search Result Card
function ProductSearchResultRow({
  item,
  currency,
  onClick,
}: {
  item: MenuItem;
  currency?: string;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const isVeg =
    item.is_vegetarian ??
    (item.tags?.toLowerCase().includes("veg") && !item.tags?.toLowerCase().includes("non"));

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
        }
      }}
      className="bg-white p-3 rounded-2xl border border-stone-200/80 hover:border-gold-400/50 shadow-xs hover:shadow-card flex items-center gap-3 transition-all cursor-pointer active:scale-[0.99] group"
    >
      {/* Thumbnail */}
      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-100">
        {!imgError ? (
          <Image
            src={resolveImageUrl(item.image_url)}
            alt={item.name}
            fill
            sizes="64px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400 bg-stone-100">
            <UtensilsCrossed className="w-5 h-5 text-stone-300" />
          </div>
        )}

        {/* Veg badge overlay */}
        <div className="absolute top-1 left-1 bg-white/90 backdrop-blur-xs p-0.5 rounded-sm shadow-2xs">
          <span className={isVeg ? "diet-badge-veg w-3 h-3" : "diet-badge-nonveg w-3 h-3"} />
        </div>
      </div>

      {/* Item Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h4 className="font-serif font-bold text-xs sm:text-sm text-brand-950 truncate max-w-[200px] leading-tight">
            {item.name}
          </h4>
          {item.is_bestseller && (
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-gold-400/20 text-gold-700 border border-gold-400/30 flex items-center gap-0.5">
              <Award className="w-2.5 h-2.5" /> Best
            </span>
          )}
          {item.is_popular && !item.is_bestseller && (
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-600 flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5" /> Popular
            </span>
          )}
        </div>

        {item.category_name && (
          <span className="text-[10px] text-stone-400 block truncate">
            {item.category_name}
          </span>
        )}

        {/* Price and Rating row */}
        <div className="mt-1 flex items-center gap-2">
          <span className="font-serif font-bold text-xs text-brand-900">
            {formatPrice(item.price, currency)}
          </span>

          {item.rating > 0 && (
            <div className="flex items-center gap-0.5 text-[10px] text-stone-600 bg-stone-50 px-1.5 py-0.5 rounded-md border border-stone-100">
              <Star className="w-2.5 h-2.5 fill-gold-500 text-gold-500" />
              <span className="font-bold">{item.rating.toFixed(1)}</span>
            </div>
          )}

          {!item.is_available && (
            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
              Sold Out
            </span>
          )}
        </div>
      </div>

      {/* Right Arrow Action */}
      <div className="w-7 h-7 rounded-full bg-stone-50 group-hover:bg-brand-50 group-hover:text-brand-900 text-stone-400 flex items-center justify-center flex-shrink-0 transition-colors">
        <ChevronRight className="w-4 h-4" />
      </div>
    </div>
  );
}
