"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LayoutGrid, ListFilter, GalleryHorizontalEnd, Sparkles, Star, Clock, ChevronRight } from "lucide-react";
import { MenuItem, Category } from "@/types";
import { MenuCard } from "./MenuCard";
import { CategoryHorizontalRow } from "./CategoryHorizontalRow";
import { EmptyState } from "@/components/common/EmptyState";
import { resolveImageUrl, formatPrice } from "@/lib/utils";

interface MenuSectionProps {
  items: MenuItem[];
  categories: Category[];
  selectedCategoryId: number | null;
  searchQuery: string;
  currency?: string;
  isSearching?: boolean;
  onSelectItem: (item: MenuItem) => void;
  onResetFilters: () => void;
  qrToken?: string;
}

export function MenuSection({
  items,
  categories,
  selectedCategoryId,
  searchQuery,
  currency,
  isSearching = false,
  onSelectItem,
  onResetFilters,
  qrToken,
}: MenuSectionProps) {
  const [viewMode, setViewMode] = React.useState<"horizontal" | "grid" | "list">("horizontal");

  if (isSearching) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-center space-y-3 bg-white rounded-3xl border border-stone-200/80 shadow-sm">
        <div className="w-8 h-8 rounded-full border-2 border-gold-500 border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-brand-950 tracking-wide">Searching culinary collection...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No dishes found"
        description="Try adjusting your search terms or clearing active filters to see available culinary selections."
        onReset={onResetFilters}
        resetText="Reset Filters"
      />
    );
  }

  // Header Bar with Section Title and View Mode Toggle
  const renderViewToggle = () => (
    <div className="flex items-center gap-1 bg-stone-100/80 p-1 rounded-xl border border-stone-200/80">
      <button
        onClick={() => setViewMode("horizontal")}
        className={`p-1.5 rounded-lg transition-all ${
          viewMode === "horizontal"
            ? "bg-white text-brand-950 shadow-2xs font-bold"
            : "text-stone-500 hover:text-stone-800"
        }`}
        title="Horizontal Scroll with Pagination"
        aria-label="Horizontal View"
      >
        <GalleryHorizontalEnd className="w-4 h-4" />
      </button>
      <button
        onClick={() => setViewMode("grid")}
        className={`p-1.5 rounded-lg transition-all ${
          viewMode === "grid"
            ? "bg-white text-brand-950 shadow-2xs font-bold"
            : "text-stone-500 hover:text-stone-800"
        }`}
        title="Grid View"
        aria-label="Grid View"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => setViewMode("list")}
        className={`p-1.5 rounded-lg transition-all ${
          viewMode === "list"
            ? "bg-white text-brand-950 shadow-2xs font-bold"
            : "text-stone-500 hover:text-stone-800"
        }`}
        title="Editorial List View"
        aria-label="Editorial List View"
      >
        <ListFilter className="w-4 h-4" />
      </button>
    </div>
  );

  // Compact Editorial List Card
  const renderListCard = (item: MenuItem) => {
    const isVeg = item.is_vegetarian ?? (item.tags?.toLowerCase().includes("veg") && !item.tags?.toLowerCase().includes("non"));

    return (
      <div
        key={item.id}
        onClick={() => onSelectItem(item)}
        className="bg-white rounded-2xl p-4 border border-stone-200/80 hover:border-gold-400/50 hover:shadow-cardHover transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 group active:scale-[0.99]"
      >
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className={isVeg ? "diet-badge-veg w-3.5 h-3.5 shrink-0" : "diet-badge-nonveg w-3.5 h-3.5 shrink-0"} />
            <h3 className="font-serif text-base font-bold text-brand-950 group-hover:text-gold-600 transition-colors truncate">
              {item.name}
            </h3>
            {item.is_bestseller && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold-100 text-gold-800 shrink-0">
                ★ Best
              </span>
            )}
          </div>

          <p className="text-xs text-text-secondary line-clamp-1 leading-relaxed">
            {item.short_description || item.description || "Artisanal recipe prepared with seasonal ingredients."}
          </p>

          <div className="flex items-center gap-3 pt-0.5">
            <span className="font-serif text-base font-bold text-brand-950">
              {formatPrice(item.price, currency)}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-gold-600 font-semibold">
              <Star className="w-3 h-3 fill-gold-500 text-gold-500" />
              <span>{item.rating > 0 ? item.rating.toFixed(1) : "5.0"}</span>
            </div>
            {item.preparation_time && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-stone-500 font-medium">
                <Clock className="w-3 h-3 text-stone-400" />
                {item.preparation_time}
              </span>
            )}
          </div>
        </div>

        {/* Thumbnail on Right */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200/60">
          <img
            src={resolveImageUrl(item.image_url)}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
          />
          {!item.is_available && (
            <div className="absolute inset-0 bg-stone-950/70 flex items-center justify-center p-1 text-center">
              <span className="text-[9px] font-bold text-gold-300 uppercase">Sold Out</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // If a specific category is selected OR a search query is active
  if (selectedCategoryId !== null || searchQuery.trim().length > 0) {
    const activeCategory = categories.find((c) => c.id === selectedCategoryId);

    return (
      <section id="menu-section" className="space-y-6 scroll-mt-20 max-w-full overflow-hidden">
        <div className="flex items-end justify-between border-b border-stone-200/70 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-gold-500 font-serif text-xs">✦</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-gold-600">
                {searchQuery ? "Search Results" : "Selected Category"}
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-950 mt-0.5">
              {searchQuery ? `"${searchQuery}"` : activeCategory?.name || "Culinary Selections"}
            </h2>
            {activeCategory?.description && !searchQuery && (
              <p className="text-xs text-text-muted mt-1 italic font-serif leading-relaxed">
                {activeCategory.description}
              </p>
            )}
            <p className="text-xs text-text-secondary mt-1">
              Showing {items.length} {items.length === 1 ? "dish" : "dishes"}
            </p>
          </div>

          {renderViewToggle()}
        </div>

        {viewMode === "horizontal" ? (
          <CategoryHorizontalRow
            category={
              activeCategory || {
                id: 0,
                name: searchQuery ? `Search: "${searchQuery}"` : "Culinary Selections",
                slug: "search-results",
                display_order: 0,
                is_active: true,
                description: `Showing all matching dishes for ${searchQuery}`,
              }
            }
            items={items}
            currency={currency}
            onSelectItem={onSelectItem}
            qrToken={qrToken}
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map((item) => (
              <MenuCard key={item.id} item={item} currency={currency} onClick={onSelectItem} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => renderListCard(item))}
          </div>
        )}
      </section>
    );
  }

  // If "All Menu" is active, display category groups
  const categoriesWithItems = categories
    .map((cat) => ({
      category: cat,
      items: items.filter((item) => item.category_id === cat.id),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div id="menu-section" className="space-y-10 scroll-mt-20 max-w-full overflow-hidden">
      <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-gold-500 font-serif text-xs">✦</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-gold-600">The Grand Menu</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-950 mt-0.5">
            Full Culinary Collection
          </h2>
        </div>
        {renderViewToggle()}
      </div>

      {categoriesWithItems.map(({ category, items: catItems }) =>
        viewMode === "horizontal" ? (
          <CategoryHorizontalRow
            key={category.id}
            category={category}
            items={catItems}
            currency={currency}
            onSelectItem={onSelectItem}
            qrToken={qrToken}
          />
        ) : (
          <section key={category.id} className="space-y-5">
            {/* Category Header with Luxury Flourish */}
            <div className="flex items-end justify-between border-b border-stone-200/70 pb-3 gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-gold-500 font-serif text-xs">✦</span>
                  {qrToken ? (
                    <Link
                      href={`/menu/${qrToken}/category/${category.id}`}
                      className="font-serif text-xl sm:text-2xl font-bold text-brand-950 hover:text-gold-600 transition-colors truncate group flex items-center gap-1.5"
                    >
                      <span>{category.name}</span>
                      <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-gold-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  ) : (
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-950 truncate">
                      {category.name}
                    </h3>
                  )}
                  <span className="text-[11px] font-bold text-gold-700 bg-gold-50 border border-gold-200/60 px-3 py-1 rounded-full shrink-0 shadow-2xs">
                    {catItems.length} {catItems.length === 1 ? "dish" : "dishes"}
                  </span>
                </div>
                {category.description && (
                  <p className="text-xs text-text-muted italic font-serif leading-relaxed line-clamp-1">
                    {category.description}
                  </p>
                )}
              </div>

              {qrToken && (
                <Link
                  href={`/menu/${qrToken}/category/${category.id}`}
                  className="text-xs font-bold text-brand-900 hover:text-gold-600 flex items-center gap-1 py-1.5 px-3 rounded-full bg-white hover:bg-gold-50 border border-stone-200/80 hover:border-gold-300 transition-all shadow-2xs shrink-0 active:scale-95 whitespace-nowrap"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gold-600" />
                </Link>
              )}
            </div>

            {/* Cards Display (Grid or List) */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {catItems.map((item) => (
                  <MenuCard key={item.id} item={item} currency={currency} onClick={onSelectItem} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {catItems.map((item) => renderListCard(item))}
              </div>
            )}
          </section>
        )
      )}
    </div>
  );
}
