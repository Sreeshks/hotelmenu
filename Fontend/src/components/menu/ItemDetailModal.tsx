"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Star,
  Clock,
  Award,
  Flame,
  Share2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Check,
  CheckCircle2,
  ChefHat,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { MenuItem } from "@/types";
import { resolveImageUrl, formatPrice } from "@/lib/utils";
import { DishRatingAndReviews } from "@/components/menu/DishRatingAndReviews";

interface ItemDetailModalProps {
  item: MenuItem | null;
  currency?: string;
  onClose: () => void;
  onRateDish?: (item: MenuItem) => void;
}

export function ItemDetailModal({
  item,
  currency,
  onClose,
  onRateDish,
}: ItemDetailModalProps) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [copiedShare, setCopiedShare] = useState(false);

  // Reset active photo index & options when inspected dish changes
  useEffect(() => {
    setActiveImgIndex(0);
    setCopiedShare(false);
  }, [item?.id]);

  // Lock body scroll while open & enable browser back button support
  useEffect(() => {
    if (!item) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Push dummy history state so hardware back button closes item detail page
    const handlePopState = () => {
      onClose();
    };
    window.history.pushState({ itemDetailOpen: true }, "");
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("popstate", handlePopState);
    };
  }, [item, onClose]);

  if (!item) return null;

  const images =
    item.images && item.images.length > 0
      ? item.images
      : item.image_url
      ? [item.image_url]
      : [];
  const currentImage = images[activeImgIndex] || images[0] || item.image_url;

  const tagsList = item.tags
    ? item.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const handleShare = () => {
    const shareData = {
      title: item.name,
      text: item.short_description || `Check out ${item.name} at Grand Hotel & Dining!`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const scrollToRateSection = () => {
    const el = document.getElementById("dish-rate-form");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const isVeg = item.is_vegetarian ?? (item.tags?.toLowerCase().includes("veg") && !item.tags?.toLowerCase().includes("non"));

  /* =========================================================================
     FULL SCREEN DETAILED ITEM PAGE VIEW
     ========================================================================= */
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F8F7F3] flex flex-col w-full h-full overflow-y-auto animate-in fade-in duration-200">
        {/* Sticky Top Header Navigation */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-stone-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-900 font-semibold text-xs transition-colors shadow-2xs"
              aria-label="Back to Menu"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Menu</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gold-600 bg-gold-50 px-2.5 py-1 rounded-md border border-gold-200/80">
                {item.category_name || "Specialty"}
              </span>
              <span className="hidden md:inline text-xs font-serif font-bold text-brand-950 truncate max-w-xs">
                {item.name}
              </span>
            </div>
          </div>

          {/* Right Action Icons & View Options */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Switch to Sheet Modal */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Switch to Compact Sheet View"
            >
              <Minimize2 className="w-3.5 h-3.5 text-stone-600" />
              <span className="hidden sm:inline">Sheet View</span>
            </button>

            {/* Share Dish */}
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 flex items-center justify-center shadow-2xs transition-colors relative"
              aria-label="Share Dish"
              title="Share Dish"
            >
              {copiedShare ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-brand-900 hover:bg-brand-950 text-white flex items-center justify-center shadow-2xs transition-colors"
              aria-label="Close"
              title="Close Details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Full-Screen Body Container */}
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-10 space-y-8">
          {/* Top Hero Banner & Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Cinematic Photography Gallery (7 cols on lg) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative aspect-[16/10] sm:aspect-[16/10] w-full rounded-3xl bg-stone-900 overflow-hidden shadow-card border border-surface-border group">
                <Image
                  src={resolveImageUrl(currentImage)}
                  alt={item.name}
                  fill
                  priority
                  className="object-cover transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                {/* Multiple Images Arrow Controls */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImgIndex((prev) =>
                          prev > 0 ? prev - 1 : images.length - 1
                        )
                      }
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all z-20 shadow-lg"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImgIndex((prev) =>
                          prev < images.length - 1 ? prev + 1 : 0
                        )
                      }
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all z-20 shadow-lg"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Badges on Photography */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                  {item.is_bestseller && (
                    <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-gold-500 text-brand-950 shadow-md flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      Bestseller
                    </span>
                  )}
                  {item.is_popular && (
                    <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-brand-950/80 backdrop-blur-md text-gold-300 shadow-md flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-gold-400" />
                      Popular Choice
                    </span>
                  )}
                  {item.is_featured && !item.is_bestseller && (
                    <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-brand-900/90 backdrop-blur-md text-white shadow-md flex items-center gap-1.5">
                      <ChefHat className="w-4 h-4 text-gold-300" />
                      Chef&apos;s Signature
                    </span>
                  )}
                </div>

                {/* Live Stock Overlay / Badge */}
                <div className="absolute bottom-4 right-4 z-10">
                  <span
                    className={`text-xs font-bold px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-md ${
                      item.is_available
                        ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
                        : "bg-rose-950/80 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {item.is_available ? "● In Stock & Ready" : "✕ Out of Stock"}
                  </span>
                </div>
              </div>

              {/* Multiple Photography Thumbnails Strip */}
              {images.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImgIndex(idx)}
                      className={`relative w-20 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                        activeImgIndex === idx
                          ? "border-gold-500 ring-2 ring-gold-400/50 shadow-sm"
                          : "border-stone-200 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={resolveImageUrl(img)}
                        alt={`${item.name} preview ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Dish Information & Options Card (5 cols on lg) */}
            <div className="lg:col-span-5 space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-surface-border shadow-card">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-gold-600">
                    {item.category_name || "Chef Specialty"}
                  </span>

                  {/* Stock Status Pill */}
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      item.is_available
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                  >
                    {item.is_available ? "Available Now" : "Unavailable"}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 mt-2">
                  <span className={isVeg ? "diet-badge-veg w-4 h-4 shrink-0" : "diet-badge-nonveg w-4 h-4 shrink-0"} />
                  <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-950 leading-tight">
                    {item.name}
                  </h1>
                </div>

                {/* Rating & Prep Time */}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 bg-gold-50 px-3 py-1 rounded-xl border border-gold-200">
                    <Star className="w-4 h-4 fill-gold-500 text-gold-500" />
                    <span className="text-sm font-bold text-brand-950">
                      {item.rating > 0 ? item.rating.toFixed(1) : "5.0"}
                    </span>
                    <span className="text-xs text-text-muted">
                      ({item.review_count || 0} reviews)
                    </span>
                  </div>

                  {item.preparation_time && (
                    <span className="text-xs text-text-secondary flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-stone-400" />
                      <span>{item.preparation_time}</span>
                    </span>
                  )}
                </div>

                {/* Price Display */}
                <div className="mt-4 pt-4 border-t border-surface-border flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-text-muted uppercase tracking-wider block">
                      Price per Serving
                    </span>
                    <span className="font-serif text-3xl sm:text-4xl font-bold text-brand-950">
                      {formatPrice(item.price, currency)}
                    </span>
                  </div>

                  <button
                    onClick={scrollToRateSection}
                    className="text-xs font-semibold text-brand-900 hover:text-brand-700 underline"
                  >
                    Jump to Reviews &darr;
                  </button>
                </div>
              </div>

              {/* Culinary Description */}
              <div className="space-y-2 pt-2 border-t border-surface-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                  Recipe & Culinary Story
                </h3>
                <p className="text-sm text-stone-700 leading-relaxed font-light">
                  {item.description ||
                    item.short_description ||
                    "Masterfully crafted by our culinary team with authentic spices, tender meats, and signature aromatic blends."}
                </p>
              </div>



              {/* Dietary Tags & Allergen Notice */}
              <div className="space-y-2 pt-4 border-t border-surface-border">
                {tagsList.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                      Dietary & Culinary Tags
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {tagsList.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-900 font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-2.5 text-xs text-stone-600 mt-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    Freshly prepared to order. If you have any allergies or specific dietary requirements, please inform your table captain.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Full-Screen Ratings, Reviews & Feedback Section */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-surface-border shadow-card space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-950 flex items-center gap-2">
                  <span>Guest Reviews & Ratings</span>
                  <Star className="w-5 h-5 fill-gold-500 text-gold-500" />
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Verified customer experiences and ratings for {item.name}
                </p>
              </div>
            </div>

            <DishRatingAndReviews
              itemId={item.id}
              itemName={item.name}
              initialAverageRating={item.rating}
              initialReviewCount={item.review_count}
              pageSize={4}
            />
          </div>
        </div>

        {/* Sticky Mobile/Desktop Bottom Action Bar */}
        <div className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-surface-border p-4 px-6 flex items-center justify-between shadow-bottomNav">
          <div>
            <span className="text-[11px] text-text-muted uppercase tracking-wider block">
              {item.name}
            </span>
            <span className="font-serif text-2xl font-bold text-brand-950">
              {formatPrice(item.price, currency)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="px-4 py-2.5 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button
              onClick={scrollToRateSection}
              className="px-6 py-2.5 rounded-2xl bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Star className="w-3.5 h-3.5 text-gold-400 fill-gold-400" />
              <span>Rate this Dish</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     COMPACT SHEET MODAL VIEW (If User Toggles "Sheet View")
     ========================================================================= */
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-950/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-surface-border overflow-hidden z-10 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300">
        {/* Floating Top Controls */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between z-30 pointer-events-none">
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center pointer-events-auto transition-colors shadow-md"
            aria-label="Share Dish"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Expand to Full Screen Option */}
            <button
              onClick={() => setIsFullscreen(true)}
              className="px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center gap-1.5 text-xs font-semibold transition-colors shadow-md"
              title="Expand to Full Screen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Screen</span>
            </button>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition-colors shadow-md"
              aria-label="Close Details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 pb-6">
          {/* Dish Photography */}
          <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full bg-stone-900 group">
            <Image
              src={resolveImageUrl(currentImage)}
              alt={item.name}
              fill
              priority
              className="object-cover transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none" />

            {/* Multiple images controls */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImgIndex((prev) =>
                      prev > 0 ? prev - 1 : images.length - 1
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all z-20 shadow-md"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImgIndex((prev) =>
                      prev < images.length - 1 ? prev + 1 : 0
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all z-20 shadow-md"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Dots indicator */}
                <div className="absolute bottom-4 right-4 flex items-center gap-1.5 z-20 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImgIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        activeImgIndex === idx
                          ? "w-5 bg-gold-400"
                          : "w-2 bg-white/60 hover:bg-white"
                      }`}
                      aria-label={`View photo ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Badges on Photography */}
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-1.5 z-10">
              {item.is_bestseller && (
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gold-500 text-brand-950 shadow-md flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  Bestseller
                </span>
              )}
              {item.is_popular && (
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-950/80 backdrop-blur-sm text-gold-300 shadow-md flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-gold-400" />
                  Popular Choice
                </span>
              )}
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold tracking-wider text-gold-600 uppercase">
                  {item.category_name || "Chef Specialty"}
                </span>

                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    item.is_available
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {item.is_available ? "In Stock & Available" : "Currently Out of Stock"}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1.5">
                <span className={isVeg ? "diet-badge-veg w-4 h-4 shrink-0" : "diet-badge-nonveg w-4 h-4 shrink-0"} />
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-950 leading-tight">
                  {item.name}
                </h2>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-gold-50 px-2.5 py-1 rounded-xl border border-gold-200">
                    <Star className="w-4 h-4 fill-gold-500 text-gold-500" />
                    <span className="text-xs font-bold text-brand-950">
                      {item.rating > 0 ? item.rating.toFixed(1) : "5.0"}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      ({item.review_count || 0})
                    </span>
                  </div>

                  {item.preparation_time && (
                    <span className="text-xs text-text-secondary flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {item.preparation_time}
                    </span>
                  )}
                </div>

                <span className="font-serif text-2xl sm:text-3xl font-bold text-brand-950">
                  {formatPrice(item.price, currency)}
                </span>
              </div>
            </div>

            {/* Culinary Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                About this Recipe
              </h4>
              <p className="text-sm text-text-secondary leading-relaxed font-light">
                {item.description ||
                  item.short_description ||
                  "An artisanal creation crafted with fresh ingredients and seasonal aromatics."}
              </p>
            </div>



            {/* Dietary Tags */}
            {tagsList.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Dietary & Culinary Attributes
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {tagsList.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 rounded-full bg-surface-bg border border-surface-border text-brand-950 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Rating & Paginated Reviews */}
            <DishRatingAndReviews
              itemId={item.id}
              itemName={item.name}
              initialAverageRating={item.rating}
              initialReviewCount={item.review_count}
              pageSize={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-surface-border bg-surface-bg/70 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-brand-950">Tried this dish?</p>
            <p className="text-[11px] text-text-muted">Share your rating with the chef</p>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById("dish-rate-form");
              if (el) {
                el.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="px-5 py-2.5 rounded-2xl bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Star className="w-3.5 h-3.5 text-gold-400 fill-gold-400" />
            <span>Rate this Dish</span>
          </button>
        </div>
      </div>
    </div>
  );
}
