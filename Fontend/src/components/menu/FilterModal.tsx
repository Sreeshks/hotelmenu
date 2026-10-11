"use client";

import React from "react";
import { X, Check, Star, Sparkles, Flame, Award } from "lucide-react";

export interface FilterState {
  availableOnly: boolean;
  onlyPopular: boolean;
  onlyBestseller: boolean;
  onlyFeatured: boolean;
  minRating: number | null;
  priceRange: "all" | "under_15" | "15_30" | "above_30";
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  currency?: string;
}

export function FilterModal({
  isOpen,
  onClose,
  filters,
  onChange,
  onReset,
  currency,
}: FilterModalProps) {
  if (!isOpen) return null;

  const curr = currency ? (currency.endsWith(" ") || currency.length === 1 ? currency : `${currency} `) : "";

  const handleToggle = (key: keyof FilterState) => {
    onChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  const setRating = (val: number | null) => {
    onChange({
      ...filters,
      minRating: filters.minRating === val ? null : val,
    });
  };

  const setPrice = (val: FilterState["priceRange"]) => {
    onChange({
      ...filters,
      priceRange: val,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Dialog / Mobile Bottom Sheet */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-surface-border overflow-hidden z-10 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-border flex items-center justify-between bg-surface-bg/50">
          <div>
            <h3 className="font-serif text-lg font-bold text-brand-950">
              Filter Culinary Menu
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Refine selections by culinary highlights and attributes
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Availability Switch */}
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
              Stock Availability
            </label>
            <button
              onClick={() => handleToggle("availableOnly")}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                filters.availableOnly
                  ? "bg-brand-50/70 border-brand-800 text-brand-950"
                  : "bg-surface-bg/40 border-surface-border text-text-secondary"
              }`}
            >
              <div>
                <p className="font-semibold text-xs sm:text-sm">Available Dishes Only</p>
                <p className="text-[11px] text-text-muted">Hide temporarily out-of-stock recipes</p>
              </div>
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
                  filters.availableOnly
                    ? "bg-brand-900 border-brand-900 text-gold-400"
                    : "border-stone-300 bg-white"
                }`}
              >
                {filters.availableOnly && <Check className="w-4 h-4" />}
              </div>
            </button>
          </div>

          {/* Badges / Highlights */}
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
              Chef Highlights & Badges
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Popular */}
              <button
                onClick={() => handleToggle("onlyPopular")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                  filters.onlyPopular
                    ? "bg-gold-50 border-gold-500 text-brand-950 font-semibold"
                    : "bg-surface-bg/40 border-surface-border text-text-secondary"
                }`}
              >
                <Flame className="w-5 h-5 text-amber-500 mb-1" />
                <span className="text-xs">Popular</span>
              </button>

              {/* Bestseller */}
              <button
                onClick={() => handleToggle("onlyBestseller")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                  filters.onlyBestseller
                    ? "bg-gold-50 border-gold-500 text-brand-950 font-semibold"
                    : "bg-surface-bg/40 border-surface-border text-text-secondary"
                }`}
              >
                <Award className="w-5 h-5 text-gold-600 mb-1" />
                <span className="text-xs">Bestseller</span>
              </button>

              {/* Featured */}
              <button
                onClick={() => handleToggle("onlyFeatured")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                  filters.onlyFeatured
                    ? "bg-gold-50 border-gold-500 text-brand-950 font-semibold"
                    : "bg-surface-bg/40 border-surface-border text-text-secondary"
                }`}
              >
                <Sparkles className="w-5 h-5 text-brand-800 mb-1" />
                <span className="text-xs">Featured</span>
              </button>
            </div>
          </div>

          {/* Minimum Rating */}
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
              Guest Rating
            </label>
            <div className="flex items-center gap-2">
              {[4.5, 4.0, 3.5].map((stars) => (
                <button
                  key={stars}
                  onClick={() => setRating(stars)}
                  className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
                    filters.minRating === stars
                      ? "bg-brand-900 border-brand-900 text-gold-400"
                      : "bg-surface-bg/40 border-surface-border text-text-secondary"
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-gold-500 text-gold-500" />
                  <span>{stars}★ & above</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
              Price Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "all", label: "All Prices" },
                { id: "under_15", label: `Under ${curr}15` },
                { id: "15_30", label: `${curr}15 – ${curr}30` },
                { id: "above_30", label: `Over ${curr}30` },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPrice(p.id as any)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                    filters.priceRange === p.id
                      ? "bg-brand-900 border-brand-900 text-white"
                      : "bg-surface-bg/40 border-surface-border text-text-secondary"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-surface-border bg-surface-bg/50 flex items-center gap-3">
          <button
            onClick={onReset}
            className="flex-1 py-3 px-4 rounded-2xl border border-surface-border text-xs font-semibold text-text-secondary bg-white hover:bg-stone-50 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs transition-colors shadow-md"
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
}
