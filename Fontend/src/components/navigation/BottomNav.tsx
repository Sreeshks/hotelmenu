"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Star, Search, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/CartContext";
import { CategoryModal } from "@/components/categories/CategoryModal";
import { Category } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { menuService } from "@/services/menu";

export type BottomNavTab = "home" | "search" | "menu" | "reviews" | "more" | "categories" | "offers" | "cart";

export interface BottomNavProps {
  activeTab?: BottomNavTab;
  onTabChange?: (tab: BottomNavTab) => void;
  onSearchClick?: () => void;
  onOffersClick?: () => void;
  onOpenCategories?: () => void;
  qrToken?: string;
  categories?: Category[];
  selectedCategoryId?: number | null;
  onSelectCategory?: (id: number | null) => void;
}

export function BottomNav({
  activeTab,
  onTabChange,
  onSearchClick,
  onOffersClick,
  onOpenCategories,
  qrToken,
  categories,
  selectedCategoryId,
  onSelectCategory,
}: BottomNavProps) {
  const router = useRouter();
  const { totalItems, setIsCartOpen } = useCart();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // If categories were not passed down, fetch them via menu query if qrToken is present
  const { data: menuData } = useQuery({
    queryKey: ["customer-menu", qrToken],
    queryFn: () => (qrToken ? menuService.getMenuByToken(qrToken) : Promise.resolve(null)),
    enabled: !!qrToken && (!categories || categories.length === 0),
    staleTime: 1000 * 60 * 3,
  });

  const resolvedCategories: Category[] =
    categories && categories.length > 0 ? categories : menuData?.categories || [];

  const handleOpenCategories = () => {
    if (onOpenCategories) {
      onOpenCategories();
    } else {
      setIsCategoryModalOpen(true);
    }
  };

  const handleCategorySelect = (id: number | null) => {
    setIsCategoryModalOpen(false);
    if (onSelectCategory) {
      onSelectCategory(id);
    } else if (qrToken) {
      if (id === null) {
        router.push(`/menu/${qrToken}`);
      } else {
        router.push(`/menu/${qrToken}/category/${id}`);
      }
    }
  };

  const handleOffersClick = () => {
    if (onOffersClick) {
      onOffersClick();
      return;
    }
    const offersEl = document.getElementById("offers-section");
    if (offersEl) {
      offersEl.scrollIntoView({ behavior: "smooth" });
    } else if (qrToken) {
      router.push(`/menu/${qrToken}#offers-section`);
    }
  };

  const handleSearchClick = () => {
    if (onSearchClick) {
      onSearchClick();
      return;
    }
    if (qrToken) {
      router.push(`/menu/${qrToken}?search=open`);
    }
  };

  return (
    <>
      {/* Floating Pill Footer Bar */}
      <div className="fixed bottom-0 inset-x-0 z-[60] bg-white/95 backdrop-blur-xl border-t border-stone-200/80 px-3 sm:px-4 py-2.5 pb-safe shadow-[0_-4px_25px_rgba(0,0,0,0.08)] flex items-center justify-center">
        <div className="flex items-center justify-center gap-2 sm:gap-3 max-w-md w-full">
          {/* 1. Categories Pill */}
          <button
            type="button"
            onClick={handleOpenCategories}
            className="flex-1 sm:flex-initial rounded-full border border-stone-200/90 bg-white hover:bg-stone-50 active:bg-stone-100 px-3.5 py-2 text-xs font-semibold text-stone-800 flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all select-none"
            aria-label="Categories"
          >
            <LayoutGrid className="w-3.5 h-3.5 stroke-[2] text-stone-700 shrink-0" />
            <span className="whitespace-nowrap">Categories</span>
          </button>

          {/* 2. Offers Pill */}
          <button
            type="button"
            onClick={handleOffersClick}
            className="flex-1 sm:flex-initial rounded-full border border-stone-200/90 bg-white hover:bg-stone-50 active:bg-stone-100 px-3.5 py-2 text-xs font-semibold text-stone-800 flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all select-none"
            aria-label="Offers"
          >
            <Star className="w-3.5 h-3.5 stroke-[2] text-stone-700 shrink-0" />
            <span className="whitespace-nowrap">Offers</span>
          </button>

          {/* 3. Search Circle Button */}
          <button
            type="button"
            onClick={handleSearchClick}
            className="rounded-full border border-stone-200/90 bg-white hover:bg-stone-50 active:bg-stone-100 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-stone-700 shadow-2xs active:scale-95 transition-all shrink-0 select-none"
            aria-label="Search dishes"
          >
            <Search className="w-4 h-4 stroke-[2]" />
          </button>

          {/* 4. Cart Pill Button */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex-1 sm:flex-initial rounded-full bg-[#133026] hover:bg-[#1a3d31] active:bg-[#0e241c] text-white px-3.5 sm:px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all select-none"
            aria-label={`Cart with ${totalItems} items`}
          >
            <ShoppingBag className="w-3.5 h-3.5 stroke-[2] shrink-0" />
            <span className="whitespace-nowrap">Cart</span>
            <span className="w-5 h-5 rounded-full bg-white text-[#133026] text-[11px] font-black flex items-center justify-center shadow-xs shrink-0">
              {totalItems}
            </span>
          </button>
        </div>
      </div>

      {/* Category Modal Popup */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={resolvedCategories}
        selectedCategoryId={selectedCategoryId ?? null}
        onSelectCategory={handleCategorySelect}
      />
    </>
  );
}
