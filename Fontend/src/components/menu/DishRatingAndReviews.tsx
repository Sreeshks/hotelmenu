"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  Send,
  CheckCircle2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  User,
  ThumbsUp,
} from "lucide-react";
import { reviewService } from "@/services/reviews";
import { ReviewCreate, Review } from "@/types";
import { getCustomerIdentifier, formatDate } from "@/lib/utils";
import { useToast } from "@/components/common/Toast";

interface DishRatingAndReviewsProps {
  itemId: number;
  itemName: string;
  locationId?: number | null;
  initialAverageRating?: number;
  initialReviewCount?: number;
  pageSize?: number;
  className?: string;
}

const RATING_LABELS: Record<number, string> = {
  1: "Could be better",
  2: "Fair",
  3: "Good taste",
  4: "Delicious",
  5: "Exceptional! ★★★★★",
};

export function DishRatingAndReviews({
  itemId,
  itemName,
  locationId,
  initialAverageRating = 5.0,
  initialReviewCount = 0,
  pageSize = 3,
  className = "",
}: DishRatingAndReviewsProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  // Rating Form State
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Fetch paginated reviews for this item
  const { data: reviewsResponse, isLoading, isFetching } = useQuery({
    queryKey: ["dish-reviews", itemId, currentPage],
    queryFn: () =>
      reviewService.getReviews({
        menu_item_id: itemId,
        page: currentPage,
        limit: pageSize,
      }),
    enabled: !!itemId,
  });

  const reviews: Review[] = reviewsResponse?.data || [];
  const pagination = reviewsResponse?.pagination;
  const totalReviews = pagination?.total ?? initialReviewCount;
  const totalPages = pagination?.total_pages ?? Math.max(1, Math.ceil(totalReviews / pageSize));

  const activeStarCount = hoverRating > 0 ? hoverRating : rating;

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || rating < 1) {
      addToast({
        type: "error",
        title: "Rating Required",
        message: "Please select a star rating between 1 and 5.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ReviewCreate = {
        customer_name: customerName.trim() || undefined,
        customer_identifier: getCustomerIdentifier(),
        review_type: "MENU_ITEM",
        menu_item_id: itemId,
        rating,
        review_text: reviewText.trim() || undefined,
        location_id: locationId || undefined,
      };

      await reviewService.submitReview(payload);

      // Invalidate relevant query caches
      queryClient.invalidateQueries({ queryKey: ["dish-reviews", itemId] });
      queryClient.invalidateQueries({ queryKey: ["customer-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["customer-menu"] });

      setSubmitSuccess(true);
      setReviewText("");
      setCurrentPage(1);

      addToast({
        type: "success",
        title: "Feedback Shared!",
        message: `Thank you for rating ${itemName}.`,
      });

      // Auto-hide success message after 4s so user can rate again if desired
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Could not submit review. Please try again.";
      addToast({
        type: "error",
        title: "Submission Error",
        message: typeof msg === "string" ? msg : JSON.stringify(msg),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* -------------------- 1. EASIER INLINE RATING FORM -------------------- */}
      <div
        id="dish-rate-form"
        className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/70 via-stone-50/60 to-gold-50/40 border border-gold-200/80 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-900 text-gold-400 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-serif text-sm sm:text-base font-bold text-brand-950">
                Rate this Dish
              </h4>
              <p className="text-[11px] text-text-muted">
                How was your experience with {itemName}?
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-gold-700 bg-gold-100/70 px-2.5 py-1 rounded-full">
            Quick Rating
          </span>
        </div>

        {submitSuccess ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-in fade-in duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-bold">Thank you for your review!</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Your rating has been recorded and posted below.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitRating} className="space-y-3.5">
            {/* 5-Star Interactive Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white/80 rounded-xl border border-stone-200/80">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 rounded-lg hover:scale-110 active:scale-95 transition-transform"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                        star <= activeStarCount
                          ? "fill-gold-500 text-gold-500 drop-shadow-xs"
                          : "fill-stone-200 text-stone-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-semibold text-gold-800">
                {RATING_LABELS[activeStarCount] || "Tap a star to rate"}
              </span>
            </div>

            {/* Optional Comment & Name */}
            <div className="space-y-2">
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your thoughts or compliments for the chef (optional)..."
                rows={2}
                maxLength={500}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-stone-200 text-xs text-text-primary placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-800 resize-none"
              />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <User className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your Name (optional)"
                    maxLength={50}
                    className="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-stone-200 text-xs text-text-primary placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 flex-shrink-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-gold-400" />
                      <span>Post Rating</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* -------------------- 2. OTHER RATINGS WITH PAGINATION -------------------- */}
      <div className="space-y-3.5 pt-2 border-t border-surface-border">
        {/* Header & Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gold-600" />
            <h4 className="font-serif text-sm sm:text-base font-bold text-brand-950">
              Customer Reviews
            </h4>
            <span className="text-xs font-semibold text-text-muted">
              ({totalReviews})
            </span>
          </div>

          {totalReviews > 0 && (
            <div className="flex items-center gap-1 text-xs font-bold text-brand-950 bg-stone-100 px-2.5 py-1 rounded-full">
              <Star className="w-3.5 h-3.5 fill-gold-500 text-gold-500" />
              <span>{initialAverageRating ? initialAverageRating.toFixed(1) : "5.0"}</span>
            </div>
          )}
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-stone-400">
            <Loader2 className="w-5 h-5 animate-spin text-gold-600" />
            <p className="text-xs">Loading customer reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-4 rounded-2xl bg-stone-50/60 border border-dashed border-stone-200 text-center space-y-1">
            <Star className="w-5 h-5 text-gold-400/60 mx-auto" />
            <p className="text-xs font-semibold text-text-primary">
              No written reviews yet for this dish.
            </p>
            <p className="text-[11px] text-text-muted">
              Be the first to share your thoughts using the rating box above!
            </p>
          </div>
        ) : (
          <div className={`space-y-3 transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}>
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-3.5 bg-surface-bg/60 hover:bg-surface-bg rounded-2xl border border-surface-border/60 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-900/10 text-brand-950 font-bold text-[10px] flex items-center justify-center">
                      {(rev.customer_name || "G").charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-brand-950 text-xs">
                      {rev.customer_name || "Verified Guest"}
                    </span>
                  </div>

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
                    <span className="text-[10px] text-text-muted ml-1">
                      {formatDate(rev.created_at)}
                    </span>
                  </div>
                </div>

                {rev.review_text ? (
                  <p className="text-xs text-text-secondary italic pl-8 leading-relaxed">
                    &ldquo;{rev.review_text}&rdquo;
                  </p>
                ) : (
                  <p className="text-[11px] text-text-muted pl-8 flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3 text-gold-600" />
                    <span>Rated {rev.rating} out of 5 stars</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* -------------------- 3. PAGINATION CONTROLS -------------------- */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 px-1 border-t border-stone-100">
            <span className="text-[11px] text-text-muted">
              Page <span className="font-semibold text-brand-950">{currentPage}</span> of{" "}
              <span className="font-semibold text-brand-950">{totalPages}</span>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isFetching}
                className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs flex items-center gap-1"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Prev</span>
              </button>

              {/* Page Number Pills */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    // Show first, last, and pages adjacent to currentPage
                    return (
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - currentPage) <= 1
                    );
                  })
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const showEllipsis = prevP && p - prevP > 1;

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && (
                          <span className="text-[10px] text-stone-400 px-0.5">
                            ...
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          disabled={isFetching}
                          className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                            currentPage === p
                              ? "bg-brand-900 text-white shadow-xs"
                              : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || isFetching}
                className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs flex items-center gap-1"
                aria-label="Next Page"
              >
                <span className="hidden sm:inline text-[11px]">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
