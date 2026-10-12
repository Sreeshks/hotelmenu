"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { MenuItem, Category } from "@/types";
import { MenuCard } from "./MenuCard";

interface CategoryHorizontalRowProps {
  category: Category;
  items: MenuItem[];
  currency?: string;
  onSelectItem: (item: MenuItem) => void;
}

export function CategoryHorizontalRow({
  category,
  items,
  currency,
  onSelectItem,
}: CategoryHorizontalRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Recalculate pages and bounds on scroll and resize
  const updateMetrics = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollLeft = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;

    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < maxScroll - 6);

    // Approximate card width including gap (280px + 16px gap)
    const cardEl = el.firstElementChild as HTMLElement | null;
    const cardWidth = cardEl ? cardEl.offsetWidth + 16 : 296;
    const visibleCards = Math.max(1, Math.round(el.clientWidth / cardWidth));

    const computedPages = Math.max(1, Math.ceil(items.length / visibleCards));
    setTotalPages(computedPages);

    const activeIndex = Math.min(
      computedPages - 1,
      Math.max(0, Math.round(scrollLeft / (visibleCards * cardWidth)))
    );
    setCurrentPage(activeIndex);
  }, [items.length]);

  useEffect(() => {
    updateMetrics();

    const el = scrollRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      updateMetrics();
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [updateMetrics]);

  const handleScroll = () => {
    updateMetrics();
  };

  const handlePrev = () => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = Math.max(280, el.clientWidth * 0.85);
    el.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };

  const handleNext = () => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = Math.max(280, el.clientWidth * 0.85);
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const handlePageClick = (pageIdx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardEl = el.firstElementChild as HTMLElement | null;
    const cardWidth = cardEl ? cardEl.offsetWidth + 16 : 296;
    const visibleCards = Math.max(1, Math.round(el.clientWidth / cardWidth));
    const targetScroll = pageIdx * (visibleCards * cardWidth);
    el.scrollTo({ left: targetScroll, behavior: "smooth" });
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-4">
      {/* Category Header with Title & Pagination Controls */}
      <div className="flex items-end justify-between border-b border-stone-200/70 pb-3 gap-3">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-gold-500 font-serif text-xs">✦</span>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-950 truncate">
              {category.name}
            </h3>
            <span className="text-[11px] font-bold text-gold-700 bg-gold-50 border border-gold-200/60 px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs">
              {items.length} {items.length === 1 ? "dish" : "dishes"}
            </span>
          </div>

          {category.description && (
            <p className="text-xs text-text-muted italic font-serif leading-relaxed line-clamp-1">
              {category.description}
            </p>
          )}
        </div>

        {/* Right Controls: Page Counter & Prev/Next Arrows */}
        <div className="flex items-center gap-2 shrink-0">
          {totalPages > 1 && (
            <span className="hidden sm:inline-block text-xs font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200/60 font-serif">
              Page <strong className="text-brand-950">{currentPage + 1}</strong> of {totalPages}
            </span>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              disabled={!canScrollLeft}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-stone-200/90 bg-white hover:bg-gold-50 hover:border-gold-400 text-brand-950 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all shadow-2xs active:scale-95"
              title="Previous dishes"
              aria-label="Previous dishes"
            >
              <ChevronLeft className="w-4 h-4 text-brand-950" />
            </button>
            <button
              onClick={handleNext}
              disabled={!canScrollRight}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-stone-200/90 bg-white hover:bg-gold-50 hover:border-gold-400 text-brand-950 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all shadow-2xs active:scale-95"
              title="Next dishes"
              aria-label="Next dishes"
            >
              <ChevronRight className="w-4 h-4 text-brand-950" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="snap-start w-[260px] sm:w-[285px] md:w-[300px] shrink-0 flex"
          >
            <div className="w-full flex">
              <MenuCard item={item} currency={currency} onClick={onSelectItem} />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Footer: Dots & Mobile Swipe Prompt */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-0.5 px-1">
          {/* Interactive Pagination Dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => handlePageClick(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentPage
                    ? "w-6 sm:w-7 bg-gradient-to-r from-gold-500 to-gold-400 shadow-xs"
                    : "w-2 bg-stone-300 hover:bg-gold-300/80"
                }`}
                title={`Page ${idx + 1}`}
                aria-label={`Go to page ${idx + 1}`}
              />
            ))}
          </div>

          <span className="text-[10px] text-text-muted font-medium sm:hidden flex items-center gap-1">
            Page {currentPage + 1}/{totalPages} • Swipe for more
          </span>
        </div>
      )}
    </section>
  );
}
