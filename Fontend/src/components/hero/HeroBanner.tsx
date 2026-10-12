"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Banner } from "@/types";
import { resolveImageUrl } from "@/lib/utils";

interface HeroBannerProps {
  banners: Banner[];
  onExploreClick?: () => void;
}

const FALLBACK_BANNER: Banner = {
  id: 0,
  title: "Good Food. Good Mood. Great Memories.",
  subtitle: "Exquisite Culinary Delights",
  description: "Fresh ingredients, artisanal flavors, and unforgettable hospitality.",
  image_url: "/placeholder-hero.jpg",
  button_text: "Explore Menu",
  button_link: "#menu-section",
  display_order: 0,
  is_active: true,
};

export function HeroBanner({ banners, onExploreClick }: HeroBannerProps) {
  const activeBanners = banners && banners.length > 0 ? banners : [FALLBACK_BANNER];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = activeBanners.length;

  useEffect(() => {
    if (total <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
    setTouchStartX(null);
  };

  const current = activeBanners[currentIndex] || FALLBACK_BANNER;
  const isFailed = imgError[current.id || 0];

  const handleExplore = (e: React.MouseEvent) => {
    if (onExploreClick) {
      e.preventDefault();
      onExploreClick();
    } else {
      const el = document.getElementById("menu-section");
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div
      className="relative w-full rounded-3xl sm:rounded-[2rem] overflow-hidden shadow-card hover:shadow-cardHover transition-all duration-500 group border border-stone-200/60"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Photography Container */}
      <div className="relative aspect-[16/10] sm:aspect-[2.2/1] lg:aspect-[2.6/1] w-full max-h-[460px] bg-stone-900 overflow-hidden">
        {!isFailed ? (
          <Image
            src={resolveImageUrl(current.image_url)}
            alt={current.title}
            fill
            priority
            sizes="100vw"
            className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
            onError={() => setImgError((prev) => ({ ...prev, [current.id || 0]: true }))}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#063B2A] via-[#0B4632] to-[#021A12] flex items-center justify-center" />
        )}

        {/* Ambient Luxury Dark Overlay with Gold Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent hidden sm:block" />

        {/* Banner Copy & Call to Action */}
        <div className="absolute inset-0 p-6 sm:p-10 lg:p-12 flex flex-col justify-end text-white max-w-2xl z-10">
          {/* Eyebrow Label Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-gold-400/40 text-[11px] uppercase tracking-widest text-gold-300 font-bold mb-2.5 w-fit shadow-2xs">
            <span className="text-gold-400">✦</span>
            <span>{current.subtitle || "Curated Dining Experience"}</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight mb-2.5 drop-shadow-lg">
            {current.title}
          </h2>

          {current.description && (
            <p className="text-xs sm:text-sm text-stone-200 line-clamp-2 max-w-lg mb-5 font-normal leading-relaxed drop-shadow">
              {current.description}
            </p>
          )}

          <div className="flex items-center gap-4 pt-1">
            <button
              onClick={handleExplore}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 hover:from-gold-400 hover:to-gold-300 text-brand-950 font-bold text-xs sm:text-sm shadow-goldGlow hover:shadow-xl transition-all duration-300 transform active:scale-95 group/btn"
            >
              <span>{current.button_text || "Explore Menu"}</span>
              <ArrowRight className="w-4 h-4 text-brand-950 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Controls & Pagination */}
      {total > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 z-20"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 z-20"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Slide Indicator Bar & Numerical Badge */}
          <div className="absolute bottom-5 right-6 flex items-center gap-2 z-20">
            <span className="text-[10px] font-bold text-stone-300 tracking-wider bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-md hidden sm:inline">
              0{currentIndex + 1} / 0{total}
            </span>
            <div className="flex items-center gap-1.5">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentIndex === idx
                      ? "w-7 bg-gold-400 shadow-sm"
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
