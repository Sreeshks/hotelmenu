"use client";

import React from "react";
import { Search, Filter, X } from "lucide-react";
import { Category } from "@/types";

interface MenuFiltersProps {
  search?: string;
  searchQuery?: string;
  onSearchChange: (val: string) => void;
  categoryId?: number | null;
  selectedCategory?: number | null;
  onCategoryChange: (val: number | null) => void;
  isAvailable?: boolean | undefined;
  availableFilter?: boolean | undefined;
  onAvailabilityChange?: (val: boolean | undefined) => void;
  onAvailableChange?: (val: boolean | undefined) => void;
  categories: Category[];
  onReset: () => void;
}

export function MenuFilters({
  search,
  searchQuery,
  onSearchChange,
  categoryId,
  selectedCategory,
  onCategoryChange,
  isAvailable,
  availableFilter,
  onAvailabilityChange,
  onAvailableChange,
  categories,
  onReset,
}: MenuFiltersProps) {
  const currentSearch = searchQuery !== undefined ? searchQuery : (search || "");
  const currentCategory = selectedCategory !== undefined ? selectedCategory : categoryId;
  const currentAvailable = availableFilter !== undefined ? availableFilter : isAvailable;
  const handleAvailabilityChange = onAvailableChange || onAvailabilityChange || (() => {});

  const hasActiveFilters = Boolean(currentSearch || currentCategory || currentAvailable !== undefined);

  return (
    <div className="bg-white dark:bg-[#121815] p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 transition-colors">
      {/* Search Bar */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={currentSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by dish name, tag, or description..."
          className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:bg-white dark:focus:bg-stone-850 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-transparent transition-all placeholder-stone-400 dark:placeholder-stone-500"
        />
        {currentSearch && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Selectors */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 md:pb-0">
        {/* Category Dropdown */}
        <select
          value={currentCategory ?? ""}
          onChange={(e) => onCategoryChange(e.target.value ? Number(e.target.value) : null)}
          className="px-3.5 py-2.5 text-xs sm:text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-700 text-stone-700 dark:text-stone-200 font-medium"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Availability Filter */}
        <select
          value={currentAvailable === undefined ? "" : currentAvailable ? "true" : "false"}
          onChange={(e) => {
            const val = e.target.value;
            handleAvailabilityChange(val === "" ? undefined : val === "true");
          }}
          className="px-3.5 py-2.5 text-xs sm:text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-700 text-stone-700 dark:text-stone-200 font-medium"
        >
          <option value="">All Stock Status</option>
          <option value="true">Available In Stock</option>
          <option value="false">Out of Stock</option>
        </select>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="px-3 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl transition-colors whitespace-nowrap"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
