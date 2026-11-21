"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Category } from "@/types";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategoryId: number | null;
  onSelectCategory: (categoryId: number | null) => void;
}

export function CategoryModal({
  isOpen,
  onClose,
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryModalProps) {
  // Prevent body scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-[390px] bg-[#FAF8F5] rounded-[28px] p-6 shadow-2xl border border-stone-200/90 z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
            Menu categories
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors active:scale-95 shadow-2xs"
            aria-label="Close categories"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Categories pill cloud */}
        <div className="flex flex-wrap gap-2 max-h-[62vh] overflow-y-auto overscroll-contain pr-1 py-1">
          {/* All dishes pill */}
          <button
            type="button"
            onClick={() => {
              onSelectCategory(null);
              onClose();
            }}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-all duration-150 active:scale-95 border ${
              selectedCategoryId === null
                ? "bg-[#133026] text-white border-[#133026] shadow-sm"
                : "bg-white text-stone-800 border-stone-200 hover:border-stone-400 shadow-2xs"
            }`}
          >
            All dishes
          </button>

          {/* Individual Category pills */}
          {categories.map((category) => {
            const isSelected = selectedCategoryId === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  onSelectCategory(category.id);
                  onClose();
                }}
                className={`rounded-full px-4 py-2 text-xs font-bold tracking-wide uppercase transition-all duration-150 active:scale-95 border ${
                  isSelected
                    ? "bg-[#133026] text-white border-[#133026] shadow-sm"
                    : "bg-white text-stone-800 border-stone-200 hover:border-stone-400 shadow-2xs"
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
