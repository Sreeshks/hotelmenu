"use client";

import React from "react";

export function HeroSkeleton() {
  return (
    <div className="w-full aspect-[16/10] sm:aspect-[2.2/1] max-h-[440px] rounded-3xl bg-stone-200/80 gold-shimmer overflow-hidden relative shadow-card border border-stone-200/70" />
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto py-3 no-scrollbar">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-stone-200/80 gold-shimmer" />
          <div className="w-14 h-3 bg-stone-200/70 rounded-full gold-shimmer" />
        </div>
      ))}
    </div>
  );
}

export function MenuCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 p-4 sm:p-5 shadow-card space-y-3 overflow-hidden">
      <div className="w-full aspect-[16/11] rounded-2xl bg-stone-200/80 gold-shimmer" />
      <div className="space-y-2 pt-1">
        <div className="w-20 h-3 bg-stone-200/60 rounded-full gold-shimmer" />
        <div className="w-3/4 h-5 bg-stone-200/80 rounded-md gold-shimmer" />
        <div className="w-full h-3 bg-stone-200/50 rounded-full gold-shimmer" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-stone-100">
        <div className="w-20 h-6 bg-stone-200/80 rounded-md gold-shimmer" />
        <div className="w-20 h-7 bg-stone-200/60 rounded-xl gold-shimmer" />
      </div>
    </div>
  );
}

export function FullMenuSkeleton() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="w-full h-14 bg-stone-200/70 rounded-2xl gold-shimmer border border-stone-200/60" />
      <HeroSkeleton />
      <CategorySkeleton />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <MenuCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
