"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Star,
  Clock,
  Flame,
  AlertTriangle,
  Sparkles,
  Share2,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Leaf,
  Beef,
} from "lucide-react";
import { menuService } from "@/services/menu";
import { reviewService } from "@/services/reviews";
import { RateExperienceModal } from "@/components/reviews/RateExperienceModal";
import { BottomNav } from "@/components/navigation/BottomNav";
import { MoreDrawer } from "@/components/navigation/MoreDrawer";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MenuItem, Review } from "@/types";
import { DEFAULT_RESTAURANT } from "@/lib/constants";

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qrToken = typeof params?.qr_token === "string" ? params.qr_token : "";
  const itemId = typeof params?.id === "string" ? Number(params.id) : 0;

  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch menu data (for context and fallback item)
  const { data: menuData } = useQuery({
    queryKey: ["customer-menu", qrToken],
    queryFn: () => menuService.getMenuByToken(qrToken),
    enabled: !!qrToken,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch individual item details
  const {
    data: item,
    isLoading: isLoadingItem,
    isError,
  } = useQuery<MenuItem>({
    queryKey: ["menu-item", itemId],
    queryFn: async () => {
      // First try to find from loaded menu
      if (menuData?.menu_items) {
        const found = menuData.menu_items.find((i) => i.id === itemId);
        if (found) return found;
      }
      return await menuService.getMenuItem(itemId);
    },
    enabled: !!itemId,
  });

  // Fetch item specific reviews
  const { data: reviewsResponse, refetch: refetchReviews } = useQuery({
    queryKey: ["item-reviews", itemId],
    queryFn: () =>
      reviewService.getReviews({
        menu_item_id: itemId,
        limit: 10,
      }),
    enabled: !!itemId,
  });

  const reviews = reviewsResponse?.data || [];
  const currency = item?.currency || menuData?.location?.currency || "$";

  const handleShare = async () => {
    if (typeof window !== "undefined") {
      if (navigator.share) {
        try {
          await navigator.share({
            title: item?.name,
            text: `Check out ${item?.name} at ${menuData?.location?.restaurant_name || "Grand Hotel"}!`,
            url: window.location.href,
          });
        } catch {
          // Ignore abort
        }
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    }
  };

  if (isLoadingItem) {
    return (
      <div className="min-h-screen bg-hotel-cream p-4 max-w-2xl mx-auto space-y-4">
        <div className="h-10 w-24 bg-hotel-dark/10 rounded-full animate-pulse" />
        <div className="aspect-video w-full bg-hotel-dark/10 rounded-3xl animate-pulse" />
        <div className="h-8 w-3/4 bg-hotel-dark/10 rounded-xl animate-pulse" />
        <div className="h-4 w-1/2 bg-hotel-dark/10 rounded-lg animate-pulse" />
        <div className="h-24 w-full bg-hotel-dark/10 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="min-h-screen bg-hotel-cream flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="font-serif font-bold text-xl text-hotel-dark mb-2">Item Not Found</h2>
        <p className="text-xs text-hotel-dark/60 mb-6 max-w-xs">
          This dish may no longer be on the active seasonal menu.
        </p>
        <button
          onClick={() => router.push(`/menu/${qrToken}`)}
          className="bg-hotel-dark text-hotel-gold px-6 py-2.5 rounded-full text-xs font-semibold"
        >
          Return to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hotel-cream text-hotel-text flex flex-col pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-hotel-cream/90 backdrop-blur-md border-b border-hotel-dark/5 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push(`/menu/${qrToken}`)}
            className="p-2 -ml-2 rounded-full hover:bg-hotel-dark/5 transition-colors flex items-center gap-1.5 text-hotel-dark font-medium text-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Menu</span>
          </button>

          <span className="font-serif font-semibold text-xs text-hotel-dark/60 uppercase tracking-widest truncate max-w-[160px]">
            {item.category?.name || "Culinary Selection"}
          </span>

          <button
            onClick={handleShare}
            className="p-2 -mr-2 rounded-full hover:bg-hotel-dark/5 text-hotel-dark transition-colors relative"
            title="Share dish"
          >
            <Share2 className="w-5 h-5" />
            {copiedLink && (
              <span className="absolute -bottom-7 right-0 text-[10px] font-medium bg-hotel-dark text-hotel-gold px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                Link copied!
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 space-y-6">
        {/* Large Image & Overlay Status */}
        <div className="relative aspect-4/3 sm:aspect-16/10 rounded-3xl overflow-hidden shadow-md bg-stone-200 border border-hotel-dark/10 group">
          <img
            src={item.image_url || "/placeholder-dish.jpg"}
            alt={item.name}
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
              !item.is_available ? "grayscale brightness-75" : ""
            }`}
          />

          {/* Gradient Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-hotel-dark/70 via-transparent to-transparent pointer-events-none" />

          {/* Badges on Top Left */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 z-10">
            {item.is_bestseller && (
              <span className="bg-hotel-gold text-hotel-dark font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Bestseller
              </span>
            )}
            {item.is_featured && (
              <span className="bg-hotel-dark/90 text-hotel-gold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-xs font-semibold">
                Chef&apos;s Pick
              </span>
            )}
            {item.is_vegetarian ? (
              <span className="bg-emerald-700/90 text-white text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-xs font-semibold flex items-center gap-1">
                <Leaf className="w-3 h-3" /> Veg
              </span>
            ) : (
              <span className="bg-amber-900/90 text-white text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-xs font-semibold flex items-center gap-1">
                <Beef className="w-3 h-3" /> Non-Veg
              </span>
            )}
          </div>

          {/* Out of Stock Ribbon / Overlay */}
          {!item.is_available && (
            <div className="absolute inset-0 bg-hotel-dark/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-red-600/95 text-white font-serif tracking-widest uppercase text-base sm:text-lg font-bold px-6 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-white/20">
                <XCircle className="w-5 h-5" />
                <span>Out of Stock</span>
              </div>
            </div>
          )}

          {/* Bottom Title Bar on Image */}
          <div className="absolute bottom-4 left-4 right-4 text-white z-10 flex items-end justify-between">
            <div>
              <span className="text-[11px] text-hotel-gold font-medium tracking-wide uppercase">
                {item.category?.name || "Specialty"}
              </span>
              <h1 className="font-serif font-bold text-2xl sm:text-3xl text-white leading-tight drop-shadow-sm">
                {item.name}
              </h1>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-serif font-bold text-hotel-gold">
                {formatCurrency(item.price, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Status Pill & Quick Specs */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-hotel-dark/5 shadow-xs">
          <div className="flex items-center gap-2">
            {item.is_available ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Available Today
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-800 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                <XCircle className="w-3.5 h-3.5 text-red-600" />
                Currently Out of Stock
              </span>
            )}

            <div className="flex items-center gap-1 text-xs bg-amber-50 text-amber-900 px-2.5 py-1 rounded-full border border-amber-200 font-bold">
              <Star className="w-3.5 h-3.5 text-hotel-gold fill-hotel-gold" />
              <span>{item.average_rating ? item.average_rating.toFixed(1) : "4.8"}</span>
              <span className="text-amber-800/60 font-normal">
                ({item.total_reviews || reviews.length || 12})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-hotel-dark/70">
            {item.preparation_time_minutes && (
              <span className="flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-hotel-dark/50" />
                {item.preparation_time_minutes} mins
              </span>
            )}
            {item.calories && (
              <span className="flex items-center gap-1 font-medium">
                <Flame className="w-3.5 h-3.5 text-hotel-dark/50" />
                {item.calories} kcal
              </span>
            )}
          </div>
        </div>

        {/* Detailed Description */}
        {item.description && (
          <div className="bg-white p-5 rounded-2xl border border-hotel-dark/5 shadow-xs space-y-2">
            <h2 className="text-xs uppercase tracking-wider font-bold text-hotel-dark/50">
              Description
            </h2>
            <p className="text-sm leading-relaxed text-hotel-text font-serif">
              {item.description}
            </p>
          </div>
        )}

        {/* Ingredients & Allergens */}
        {(item.ingredients || item.allergens) && (
          <div className="bg-white p-5 rounded-2xl border border-hotel-dark/5 shadow-xs space-y-4">
            {item.ingredients && (
              <div className="space-y-1.5">
                <h2 className="text-xs uppercase tracking-wider font-bold text-hotel-dark/50">
                  Ingredients
                </h2>
                <p className="text-xs leading-relaxed text-hotel-text/80">
                  {item.ingredients}
                </p>
              </div>
            )}

            {item.allergens && (
              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-amber-900 block">Allergy Notice</span>
                  <p className="text-xs text-amber-800 leading-normal">
                    Contains: {item.allergens}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nutritional Details if present */}
        {(item.protein_g || item.carbs_g || item.fat_g) && (
          <div className="bg-white p-5 rounded-2xl border border-hotel-dark/5 shadow-xs space-y-3">
            <h2 className="text-xs uppercase tracking-wider font-bold text-hotel-dark/50">
              Nutritional Profile (per serving)
            </h2>
            <div className="grid grid-cols-3 gap-2 text-center">
              {item.protein_g != null && (
                <div className="p-3 bg-hotel-cream rounded-xl border border-hotel-dark/5">
                  <span className="text-xs text-hotel-dark/60 block font-medium">Protein</span>
                  <span className="font-serif font-bold text-sm text-hotel-dark">{item.protein_g}g</span>
                </div>
              )}
              {item.carbs_g != null && (
                <div className="p-3 bg-hotel-cream rounded-xl border border-hotel-dark/5">
                  <span className="text-xs text-hotel-dark/60 block font-medium">Carbs</span>
                  <span className="font-serif font-bold text-sm text-hotel-dark">{item.carbs_g}g</span>
                </div>
              )}
              {item.fat_g != null && (
                <div className="p-3 bg-hotel-cream rounded-xl border border-hotel-dark/5">
                  <span className="text-xs text-hotel-dark/60 block font-medium">Fats</span>
                  <span className="font-serif font-bold text-sm text-hotel-dark">{item.fat_g}g</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews for this Dish */}
        <section className="bg-white p-5 rounded-3xl border border-hotel-dark/5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-base text-hotel-dark flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-hotel-gold" />
                <span>Guest Reviews for this Dish</span>
              </h2>
              <p className="text-xs text-hotel-dark/60 mt-0.5">
                {reviews.length} feedback submissions
              </p>
            </div>

            <button
              onClick={() => setIsRateModalOpen(true)}
              className="text-xs font-semibold bg-hotel-dark text-hotel-gold px-3 py-1.5 rounded-full hover:bg-hotel-dark/90 transition-all flex items-center gap-1 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Review Dish</span>
            </button>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-hotel-dark/10 rounded-2xl p-4">
              <Star className="w-6 h-6 text-hotel-gold/40 mx-auto mb-2" />
              <p className="text-xs text-hotel-dark/70 font-medium">
                No reviews specifically for this dish yet.
              </p>
              <p className="text-[11px] text-hotel-dark/50 mt-1">
                Tried this today? Share your thoughts with our culinary team!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev: Review) => (
                <div
                  key={rev.id}
                  className="p-3.5 bg-hotel-cream/50 rounded-xl border border-hotel-dark/5 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-hotel-dark">
                      {rev.customer_name || "Guest Patron"}
                    </span>
                    <div className="flex items-center gap-1 text-hotel-gold">
                      <Star className="w-3.5 h-3.5 fill-hotel-gold" />
                      <span className="font-bold text-hotel-dark">{rev.rating}</span>
                    </div>
                  </div>

                  {rev.review_text && (
                    <p className="text-xs italic text-hotel-text/80">
                      &ldquo;{rev.review_text}&rdquo;
                    </p>
                  )}

                  <div className="text-[10px] text-hotel-dark/40">
                    {formatDate(rev.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* View Only Notice */}
        <div className="text-center py-4 border-t border-hotel-dark/5">
          <p className="text-xs text-hotel-dark/50 italic">
            This is an interactive digital menu. Please inform your server to order this item.
          </p>
        </div>
      </main>

      {/* Persistent Bottom Nav */}
      <BottomNav
        activeTab="menu"
        onTabChange={(tab) => {
          if (tab === "home" || tab === "menu") {
            router.push(`/menu/${qrToken}`);
          } else if (tab === "reviews") {
            router.push(`/menu/${qrToken}/reviews`);
          } else if (tab === "more") {
            setIsMoreDrawerOpen(true);
          }
        }}
      />

      {/* More Info Drawer */}
      <MoreDrawer
        isOpen={isMoreDrawerOpen}
        onClose={() => setIsMoreDrawerOpen(false)}
        restaurant={{
          ...DEFAULT_RESTAURANT,
          name: menuData?.location?.restaurant_name || menuData?.location?.name || DEFAULT_RESTAURANT.name,
        }}
        location={menuData?.location}
        onOpenRateModal={() => setIsRateModalOpen(true)}
        qrToken={qrToken}
      />

      {/* Review Modal pre-selected for this dish */}
      <RateExperienceModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        menuItems={menuData?.menu_items || (item ? [item] : [])}
        preselectedItem={item}
        locationId={menuData?.location?.id}
        onSuccess={() => {
          refetchReviews();
        }}
      />
    </div>
  );
}
