import React from "react";
import { Star } from "lucide-react";

import { DashboardStats } from "@/types";

interface ReviewChartProps {
  averageRating?: number;
  totalReviews?: number;
  distribution?: Record<string, number>;
  stats?: DashboardStats;
}

export function ReviewChart({
  averageRating,
  totalReviews,
  distribution,
  stats,
}: ReviewChartProps) {
  const avg = averageRating ?? stats?.average_restaurant_rating ?? 5.0;
  const total = totalReviews ?? stats?.total_reviews ?? 0;
  const dist = distribution ?? { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
  const stars = ["5", "4", "3", "2", "1"];

  return (
    <div className="bg-white dark:bg-[#11161e] p-6 rounded-2xl border border-stone-200/90 dark:border-white/[0.08] shadow-card dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] flex flex-col justify-between transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold font-serif text-stone-900 dark:text-white">Rating Breakdown</h3>
          <p className="text-xs text-stone-400 dark:text-stone-400 mt-0.5">Customer feedback distribution</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-50 dark:bg-gold-500/10 border border-gold-200 dark:border-gold-500/25 rounded-xl shadow-2xs">
          <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
          <span className="text-sm font-bold text-gold-700 dark:text-gold-300">{avg.toFixed(1)}</span>
          <span className="text-xs text-stone-400 dark:text-stone-400">/ 5.0</span>
        </div>
      </div>

      <div className="space-y-2.5 my-auto">
        {stars.map((star) => {
          const count = dist[star] || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <div key={star} className="flex items-center gap-3 text-xs">
              <span className="w-7 font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                {star}
                <Star className="w-3 h-3 text-gold-500 fill-gold-500 inline" />
              </span>

              <div className="flex-1 h-3 bg-stone-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gold-400 to-amber-500 dark:from-gold-400 dark:to-gold-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(217,173,72,0.3)]"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <span className="w-9 text-right font-mono text-stone-400 dark:text-stone-400">{percentage}%</span>
              <span className="w-8 text-right font-mono text-stone-600 dark:text-stone-200 font-semibold">{count}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-stone-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
        <span>Total Evaluated Feedback</span>
        <span className="font-bold text-stone-800 dark:text-stone-200">{total} Reviews</span>
      </div>
    </div>
  );
}
