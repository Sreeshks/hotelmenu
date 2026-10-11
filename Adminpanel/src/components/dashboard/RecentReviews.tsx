import React from "react";
import Link from "next/link";
import { Review } from "@/types";
import { Star, MessageSquareQuote, ChevronRight, CheckCircle, EyeOff } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface RecentReviewsProps {
  reviews: Review[];
}

export function RecentReviews({ reviews }: RecentReviewsProps) {
  return (
    <div className="bg-white dark:bg-[#11161e] p-6 rounded-2xl border border-stone-200/90 dark:border-white/[0.08] shadow-card dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold font-serif text-stone-900 dark:text-white flex items-center gap-2">
            <span>Recent Guest Feedback</span>
            <MessageSquareQuote className="w-4 h-4 text-brand-700 dark:text-gold-400" />
          </h3>
          <p className="text-xs text-stone-400 dark:text-stone-400 mt-0.5">Latest submitted customer reviews</p>
        </div>
        <Link
          href="/reviews"
          className="text-xs font-semibold text-brand-700 dark:text-gold-400 hover:text-brand-900 dark:hover:text-gold-300 flex items-center gap-1 hover:underline"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-stone-100 dark:divide-white/[0.06]">
        {reviews.length === 0 ? (
          <p className="text-xs text-stone-400 dark:text-stone-400 py-6 text-center">No reviews submitted yet.</p>
        ) : (
          reviews.slice(0, 5).map((rev) => (
            <div key={rev.id} className="py-3.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                    {rev.customer_name || "Anonymous Guest"}
                  </span>
                  <span className="text-[10px] bg-stone-100 dark:bg-white/[0.06] text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-full font-medium">
                    {rev.review_type.replace("_", " ")}
                  </span>
                </div>

                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < rev.rating
                          ? "text-gold-500 fill-gold-500"
                          : "text-stone-200 dark:text-stone-700 fill-stone-200 dark:fill-stone-700"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {rev.review_text && (
                <p className="text-xs text-stone-600 dark:text-stone-300 italic line-clamp-2 leading-relaxed">
                  &ldquo;{rev.review_text}&rdquo;
                </p>
              )}

              <div className="flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500 pt-0.5">
                <span>
                  {rev.menu_item_name && `Dish: ${rev.menu_item_name}`}
                  {rev.staff_name && `Staff: ${rev.staff_name}`}
                  {rev.location_name && ` • ${rev.location_name}`}
                </span>
                <span>{formatDate(rev.created_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
