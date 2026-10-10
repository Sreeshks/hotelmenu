"use client";

import React from "react";
import { MenuItem, Category } from "@/types";
import { MenuCard } from "./MenuCard";
import { EmptyState } from "@/components/common/EmptyState";

interface MenuSectionProps {
  items: MenuItem[];
  categories: Category[];
  selectedCategoryId: number | null;
  searchQuery: string;
  onSelectItem: (item: MenuItem) => void;
  onResetFilters: () => void;
}

export function MenuSection({
  items,
  categories,
  selectedCategoryId,
  searchQuery,
  onSelectItem,
  onResetFilters,
}: MenuSectionProps) {
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

  // If a specific category is selected OR a search query is active, display a single flat grid
  if (selectedCategoryId !== null || searchQuery.trim().length > 0) {
    const activeCategory = categories.find((c) => c.id === selectedCategoryId);

    return (
      <section id="menu-section" className="space-y-4 scroll-mt-20">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-950">
            {searchQuery ? `Search Results for "${searchQuery}"` : activeCategory?.name || "Culinary Selections"}
          </h2>
          {activeCategory?.description && !searchQuery && (
            <p className="text-xs text-text-muted mt-0.5">{activeCategory.description}</p>
          )}
          <p className="text-xs text-text-secondary mt-0.5">
            Showing {items.length} {items.length === 1 ? "dish" : "dishes"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((item) => (
            <MenuCard key={item.id} item={item} onClick={onSelectItem} />
          ))}
        </div>
      </section>
    );
  }

  // If "All Menu" is active without search, group items by their categories
  const categoriesWithItems = categories
    .map((cat) => ({
      category: cat,
      items: items.filter((item) => item.category_id === cat.id),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div id="menu-section" className="space-y-10 scroll-mt-20">
      {categoriesWithItems.map(({ category, items: catItems }) => (
        <section key={category.id} className="space-y-4">
          {/* Category Header */}
          <div className="flex items-end justify-between border-b border-surface-border/80 pb-2">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-950">
                {category.name}
              </h2>
              {category.description && (
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                  {category.description}
                </p>
              )}
            </div>
            <span className="text-[11px] font-semibold text-text-muted bg-stone-100 px-2.5 py-1 rounded-full shrink-0 ml-3 mb-0.5">
              {catItems.length} {catItems.length === 1 ? "dish" : "dishes"}
            </span>
          </div>

          {/* Horizontal Scroll Row */}
          <div
            className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {catItems.map((item) => (
              <div
                key={item.id}
                className="snap-start shrink-0 w-56 sm:w-64"
              >
                <MenuCard item={item} onClick={onSelectItem} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
