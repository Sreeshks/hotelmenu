import React from "react";
import Link from "next/link";
import { MenuItem } from "@/types";
import { Star, Flame, UtensilsCrossed, ChevronRight } from "lucide-react";
import { formatPrice, resolveImageUrl } from "@/lib/utils";
import { useSettings } from "@/components/providers/SettingsProvider";

interface PopularItemsProps {
  items: MenuItem[];
}

export function PopularItems({ items }: PopularItemsProps) {
  const { currencySymbol } = useSettings();
  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold font-serif text-stone-900 flex items-center gap-2">
            <span>Popular Menu Items</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">Top guest preferences</p>
        </div>
        <Link
          href="/menu?is_popular=true"
          className="text-xs font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1 hover:underline"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-stone-100">
        {items.length === 0 ? (
          <p className="text-xs text-stone-400 py-6 text-center">No popular dishes marked yet.</p>
        ) : (
          items.slice(0, 5).map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between gap-3 group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-stone-100 overflow-hidden shrink-0 flex items-center justify-center border border-stone-200">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveImageUrl(item.image_url)}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <UtensilsCrossed className="w-5 h-5 text-stone-400" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900 truncate group-hover:text-brand-850 transition-colors">
                    {item.name}
                  </p>
                  <p className="text-xs text-stone-400 truncate">{item.category_name || "Specialty"}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-stone-900">{formatPrice(item.price, currencySymbol)}</p>
                <div className="flex items-center gap-1 text-[11px] text-gold-600 justify-end font-semibold">
                  <Star className="w-3 h-3 text-gold-500 fill-gold-500" />
                  <span>{item.rating.toFixed(1)}</span>
                  <span className="text-stone-400">({item.review_count})</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
