"use client";

import React from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Star,
  Clock,
  Award,
  Flame,
  MessageSquare,
  Sparkles,
  Share2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { MenuItem } from "@/types";
import { resolveImageUrl, formatPrice, formatDate } from "@/lib/utils";
import { reviewService } from "@/services/reviews";

interface ItemDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onRateDish?: (item: MenuItem) => void;
}

export function ItemDetailModal({
  item,
  onClose,
  onRateDish,
}: ItemDetailModalProps) {
  // Query recent customer reviews specifically for this dish
  const { data: reviewsResponse } = useQuery({
    queryKey: ["dish-reviews", item?.id],
    queryFn: () =>
      reviewService.getReviews({
        menu_item_id: item?.id,
        limit: 5,
      }),
    enabled: !!item?.id,
  });

  if (!item) return null;

  const reviews = reviewsResponse?.data || [];

  const [activeImgIndex, setActiveImgIndex] = React.useState(0);
  const images = (item.images && item.images.length > 0) ? item.images : (item.image_url ? [item.image_url] : []);
  const currentImage = images[activeImgIndex] || images[0] || item.image_url;

  const tagsList = item.tags
    ? item.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: item.name,
        text: item.short_description || `Check out ${item.name} at Grand Hotel & Dining!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-950/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-surface-border overflow-hidden z-10 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300">
        {/* Floating Top Controls */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between z-30 pointer-events-none">
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center pointer-events-auto transition-colors shadow-md"
            aria-label="Share Dish"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center pointer-events-auto transition-colors shadow-md"
            aria-label="Close Details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 pb-6">
          {/* Large Dish Photography */}
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
                  onClick={() => setActiveImgIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all z-20 shadow-md"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImgIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all z-20 shadow-md"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Photo thumbnails / dots bar */}
                <div className="absolute bottom-4 right-4 flex items-center gap-1.5 z-20 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImgIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        activeImgIndex === idx ? "w-5 bg-gold-400" : "w-2 bg-white/60 hover:bg-white"
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
            {/* Title, Category & Price */}
            <div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold tracking-wider text-gold-600 uppercase">
                  {item.category_name || "Chef Specialty"}
                </span>

                {/* Stock Status Pill */}
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

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-950 mt-1.5 leading-tight">
                {item.name}
              </h2>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border">
                {/* Rating & Prep time */}
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

                {/* Price */}
                <span className="font-serif text-2xl sm:text-3xl font-bold text-brand-950">
                  {formatPrice(item.price)}
                </span>
              </div>
            </div>

            {/* Culinary Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                About this Recipe
              </h4>
              <p className="text-sm text-text-secondary leading-relaxed font-light">
                {item.description || item.short_description || "An artisanal creation crafted with fresh ingredients and seasonal aromatics."}
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

            {/* Customer Reviews for this Dish */}
            <div className="space-y-3 pt-2 border-t border-surface-border">
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-base font-bold text-brand-950 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gold-600" />
                  Guest Reviews
                </h4>

                {onRateDish && (
                  <button
                    onClick={() => {
                      onClose();
                      onRateDish(item);
                    }}
                    className="text-xs font-semibold text-brand-900 hover:text-gold-600 transition-colors"
                  >
                    Rate this Dish →
                  </button>
                )}
              </div>

              {reviews.length === 0 ? (
                <p className="text-xs text-text-muted italic py-2">
                  No written reviews yet for this dish. Be the first to share your dining experience!
                </p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 bg-surface-bg/60 rounded-2xl border border-surface-border/60 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-gold-600">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= rev.rating
                                  ? "fill-gold-500 text-gold-500"
                                  : "fill-stone-200 text-stone-200"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-text-muted">
                          {formatDate(rev.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-text-primary italic">
                        &quot;{rev.review_text || "Delicious experience!"}&quot;
                      </p>
                      <p className="text-[10px] text-text-muted text-right">
                        — {rev.customer_name || "Guest"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer: Rate this Dish action */}
        {onRateDish && (
          <div className="p-4 sm:p-5 border-t border-surface-border bg-surface-bg/70 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-brand-950">Tried this dish?</p>
              <p className="text-[11px] text-text-muted">Share your thoughts with the chef</p>
            </div>
            <button
              onClick={() => {
                onClose();
                onRateDish(item);
              }}
              className="px-5 py-2.5 rounded-2xl bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Star className="w-3.5 h-3.5 text-gold-400 fill-gold-400" />
              <span>Leave Feedback</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
