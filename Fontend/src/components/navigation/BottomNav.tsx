"use client";

import React from "react";
import Link from "next/link";
import { Home, Search, Utensils, MessageSquare, MoreHorizontal } from "lucide-react";

export type BottomNavTab = "home" | "search" | "menu" | "reviews" | "more";

interface BottomNavProps {
  activeTab: BottomNavTab;
  onTabChange: (tab: BottomNavTab) => void;
  onSearchClick?: () => void;
  qrToken?: string;
}

export function BottomNav({ activeTab, onTabChange, onSearchClick, qrToken }: BottomNavProps) {
  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onTabChange("menu");
    const el = document.getElementById("menu-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleReviewsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onTabChange("reviews");
    const el = document.getElementById("reviews-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onTabChange("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onTabChange("search");
    if (onSearchClick) {
      onSearchClick();
    } else {
      const searchSection = document.getElementById("search-section");
      if (searchSection) {
        searchSection.scrollIntoView({ behavior: "smooth" });
      }
      const searchInput = document.getElementById("menu-search-input") as HTMLInputElement | null;
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 250);
      }
    }
  };

  return (
    <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-stone-200/80 shadow-[0_-4px_25px_rgba(6,59,42,0.07)] pb-safe">
      <div className="grid grid-cols-5 h-16 px-1">
        {/* Home */}
        <button
          onClick={handleHomeClick}
          className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${
            activeTab === "home" ? "text-brand-900 font-bold" : "text-stone-400 hover:text-stone-700"
          }`}
          aria-label="Home"
        >
          <div
            className={`p-1 rounded-xl transition-all ${
              activeTab === "home" ? "bg-brand-50 text-brand-900" : ""
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === "home" ? "stroke-[2.5] text-brand-900" : ""}`} />
          </div>
          <span className="text-[10px] tracking-tight">Home</span>
          {activeTab === "home" && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-gold-500" />
          )}
        </button>

        {/* Search */}
        <button
          onClick={handleSearchClick}
          className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${
            activeTab === "search" ? "text-brand-900 font-bold" : "text-stone-400 hover:text-stone-700"
          }`}
          aria-label="Search products"
        >
          <div
            className={`p-1 rounded-xl transition-all ${
              activeTab === "search" ? "bg-brand-50 text-brand-900" : ""
            }`}
          >
            <Search className={`w-5 h-5 ${activeTab === "search" ? "stroke-[2.5] text-brand-900" : ""}`} />
          </div>
          <span className="text-[10px] tracking-tight">Search</span>
          {activeTab === "search" && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-gold-500" />
          )}
        </button>

        {/* Menu */}
        <button
          onClick={handleMenuClick}
          className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${
            activeTab === "menu" ? "text-brand-900 font-bold" : "text-stone-400 hover:text-stone-700"
          }`}
          aria-label="Menu"
        >
          <div
            className={`p-1 rounded-xl transition-all ${
              activeTab === "menu" ? "bg-brand-50 text-brand-900" : ""
            }`}
          >
            <Utensils className={`w-5 h-5 ${activeTab === "menu" ? "stroke-[2.5] text-brand-900" : ""}`} />
          </div>
          <span className="text-[10px] tracking-tight">Menu</span>
          {activeTab === "menu" && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-gold-500" />
          )}
        </button>

        {/* Reviews */}
        <button
          onClick={handleReviewsClick}
          className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${
            activeTab === "reviews" ? "text-brand-900 font-bold" : "text-stone-400 hover:text-stone-700"
          }`}
          aria-label="Reviews"
        >
          <div
            className={`p-1 rounded-xl transition-all ${
              activeTab === "reviews" ? "bg-brand-50 text-brand-900" : ""
            }`}
          >
            <MessageSquare className={`w-5 h-5 ${activeTab === "reviews" ? "stroke-[2.5] text-brand-900" : ""}`} />
          </div>
          <span className="text-[10px] tracking-tight">Reviews</span>
          {activeTab === "reviews" && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-gold-500" />
          )}
        </button>

        {/* More */}
        <button
          onClick={() => onTabChange("more")}
          className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${
            activeTab === "more" ? "text-brand-900 font-bold" : "text-stone-400 hover:text-stone-700"
          }`}
          aria-label="Concierge and info"
        >
          <div
            className={`p-1 rounded-xl transition-all ${
              activeTab === "more" ? "bg-brand-50 text-brand-900" : ""
            }`}
          >
            <MoreHorizontal className={`w-5 h-5 ${activeTab === "more" ? "stroke-[2.5] text-brand-900" : ""}`} />
          </div>
          <span className="text-[10px] tracking-tight">Concierge</span>
          {activeTab === "more" && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-gold-500" />
          )}
        </button>
      </div>
    </div>
  );
}
