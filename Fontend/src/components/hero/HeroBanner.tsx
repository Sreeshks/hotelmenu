"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight, Flame, Sparkles } from "lucide-react";
import { Banner } from "@/types";
import { resolveImageUrl } from "@/lib/utils";

interface HeroBannerProps {
  banners: Banner[];
  onExploreClick?: () => void;
  onSelectCategory?: (categoryId: number | null) => void;
  onOffersClick?: () => void;
}

const FALLBACK_BANNER: Banner = {
  id: 0,
  title: "Today's Special Dum Biriyani",
  subtitle: "Authentic Malabar Flavors",
  description: "Slow-cooked fragrant basmati rice infused with whole spices, tender meat, rich saffron & golden caramelized onions.",
  image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1600&q=80",
  button_text: "Order Biriyani",
  button_link: "#menu-section",
  display_order: 1,
  is_active: true,
};

export function HeroBanner({
  banners,
  onExploreClick,
  onSelectCategory,
  onOffersClick,
}: HeroBannerProps) {
  const activeBanners = banners && banners.length > 0 ? banners : [FALLBACK_BANNER];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = activeBanners.length;

  // Auto-advance slides every 5.5 seconds unless paused on hover
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  // Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const diffX = touchStartX - e.changedTouches[0].clientX;
    const diffY = touchStartY - e.changedTouches[0].clientY;

    // Only swipe if horizontal drag is significantly larger than vertical scroll
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) goToNext();
      else goToPrev();
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  const handleButtonClick = (banner: Banner) => {
    const rawLink = banner.button_link?.trim();

    if (!rawLink) {
      if (onExploreClick) onExploreClick();
      else {
        const el = document.getElementById("menu-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    // 1. Category Target: e.g. #category-5 or category:5
    if (rawLink.startsWith("#category-") || rawLink.startsWith("category:")) {
      const catId = parseInt(rawLink.replace("#category-", "").replace("category:", ""), 10);
      if (!isNaN(catId)) {
        if (onSelectCategory) {
          onSelectCategory(catId);
          return;
        }
        const catEl = document.getElementById(`category-${catId}`);
        if (catEl) {
          catEl.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }
    }

    // 2. Offers Target: #offers-section or offers
    if (rawLink === "#offers-section" || rawLink === "offers") {
      if (onOffersClick) {
        onOffersClick();
        return;
      }
      const offersEl = document.getElementById("offers-section");
      if (offersEl) {
        offersEl.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }

    // 3. Menu / All Dishes Target: #menu-section or /menu
    if (rawLink === "#menu-section" || rawLink === "/menu") {
      if (onSelectCategory) {
        onSelectCategory(null);
      } else if (onExploreClick) {
        onExploreClick();
      } else {
        const menuEl = document.getElementById("menu-section");
        if (menuEl) menuEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    // 4. Any other hash link (e.g. #bestsellers-section, #popular-section)
    if (rawLink.startsWith("#")) {
      const el = document.getElementById(rawLink.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }

    // 5. External or relative URL
    if (rawLink.startsWith("http://") || rawLink.startsWith("https://") || rawLink.startsWith("/")) {
      window.location.href = rawLink;
      return;
    }

    if (onExploreClick) {
      onExploreClick();
    } else {
      const el = document.getElementById("menu-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div
      className="relative w-full rounded-3xl sm:rounded-[2rem] overflow-hidden shadow-card hover:shadow-cardHover transition-all duration-500 group border border-stone-200/80 bg-stone-950 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Sliding Viewport Track */}
      <div className="relative aspect-[16/11] sm:aspect-[2.1/1] lg:aspect-[2.5/1] w-full max-h-[460px] overflow-hidden">
        <div
          className="flex h-full w-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {activeBanners.map((banner, idx) => {
            const isFailed = imgError[banner.id || idx];
            const isSpecial =
              banner.title?.toLowerCase().includes("special") ||
              banner.subtitle?.toLowerCase().includes("special") ||
              banner.title?.toLowerCase().includes("today");

            return (
              <div key={banner.id || idx} className="relative min-w-full w-full h-full shrink-0 overflow-hidden bg-stone-900">
                {/* Background Photography */}
                {!isFailed && banner.image_url ? (
                  <img
                    src={resolveImageUrl(banner.image_url)}
                    alt={banner.title}
                    className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                    onError={() => setImgError((prev) => ({ ...prev, [banner.id || idx]: true }))}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#063B2A] via-[#0B4632] to-[#021A12] flex items-center justify-center" />
                )}

                {/* Cinematic Multi-stop Dark Vignette Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-transparent hidden sm:block" />

                {/* Text Content & Call to Action */}
                <div className="absolute inset-0 p-5 sm:p-8 lg:p-12 flex flex-col justify-end text-white max-w-2xl z-10">
                  {/* Eyebrow Pill Badge */}
                  <div className="mb-2.5 flex items-center gap-2">
                    {isSpecial ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-sm">
                        <Flame className="w-3.5 h-3.5 fill-white" />
                        <span>Today&apos;s Special</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-gold-300 text-[11px] font-bold uppercase tracking-wider shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                        <span>{banner.subtitle || "Curated Culinary Feast"}</span>
                      </div>
                    )}
                  </div>

                  {/* Main Title */}
                  <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15] mb-2 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                    {banner.title}
                  </h2>

                  {/* Description Subtext */}
                  {banner.description && (
                    <p className="text-xs sm:text-sm text-stone-200/90 line-clamp-2 max-w-lg mb-4 font-normal leading-relaxed drop-shadow">
                      {banner.description}
                    </p>
                  )}

                  {/* CTA Button */}
                  <div className="flex items-center gap-4 pt-1">
                    <button
                      type="button"
                      onClick={() => handleButtonClick(banner)}
                      className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-amber-500 via-gold-400 to-amber-500 hover:from-amber-400 hover:to-gold-300 text-stone-950 font-bold text-xs sm:text-sm shadow-[0_4px_20px_rgba(245,158,11,0.35)] hover:shadow-[0_6px_25px_rgba(245,158,11,0.5)] transition-all active:scale-95 group/btn"
                    >
                      <span>{banner.button_text || "Explore Dishes"}</span>
                      <ArrowRight className="w-4 h-4 text-stone-950 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Controls (Left / Right chevrons) */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrev}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md border border-white/10 items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 z-20"
            aria-label="Previous Banner"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md border border-white/10 items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 z-20"
            aria-label="Next Banner"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Slide Indicator Bar & Counter */}
          <div className="absolute bottom-4 sm:bottom-5 right-4 sm:right-6 flex items-center gap-2.5 z-20">
            <span className="text-[10px] font-bold text-stone-300 tracking-wider bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-md border border-white/10 hidden sm:inline">
              0{currentIndex + 1} / 0{total}
            </span>
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1.5 rounded-full border border-white/10">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentIndex === idx
                      ? "w-7 bg-amber-400 shadow-sm"
                      : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
