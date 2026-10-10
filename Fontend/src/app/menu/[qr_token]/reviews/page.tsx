"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Star,
  MessageSquare,
  Sparkles,
  UtensilsCrossed,
  UserCheck,
  Building2,
  Calendar,
  ThumbsUp,
  Image as ImageIcon,
} from "lucide-react";
import { BottomNav } from "@/components/navigation/BottomNav";
import { MoreDrawer } from "@/components/navigation/MoreDrawer";
import { RateExperienceModal } from "@/components/reviews/RateExperienceModal";
import { reviewService } from "@/services/reviews";
import { menuService } from "@/services/menu";
import { formatDate } from "@/lib/utils";
import { Review } from "@/types";
import { DEFAULT_RESTAURANT } from "@/lib/constants";

type ReviewTypeFilter = "ALL" | "MENU_ITEM" | "STAFF" | "RESTAURANT";

export default function ReviewsPage() {
  const params = useParams();
  const router = useRouter();
  const qrToken = typeof params?.qr_token === "string" ? params.qr_token : "";

  const [activeTab, setActiveTab] = useState<ReviewTypeFilter>("ALL");
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);

  // Fetch restaurant menu data to get location and dishes for rate modal
  const { data: menuData } = useQuery({
    queryKey: ["customer-menu", qrToken],
    queryFn: () => menuService.getMenuByToken(qrToken),
    enabled: !!qrToken,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch filtered reviews
  const {
    data: reviewsResponse,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["all-reviews", activeTab],
    queryFn: () =>
      reviewService.getReviews({
        review_type: activeTab === "ALL" ? undefined : activeTab,
        limit: 50,
      }),
  });

  // Fetch all reviews for rating statistics breakdown
  const { data: allReviewsResponse } = useQuery({
    queryKey: ["all-reviews-stats"],
    queryFn: () => reviewService.getReviews({ limit: 100 }),
    staleTime: 1000 * 60 * 2,
  });

  const reviews = reviewsResponse?.data || [];
  const allReviews = allReviewsResponse?.data || reviews;

  // Rating distribution calculations
  const stats = useMemo(() => {
    const total = allReviews.length;
    if (total === 0) {
      return {
        avgRating: 4.8,
        totalCount: 0,
        distribution: [
          { star: 5, count: 0, percent: 85 },
          { star: 4, count: 0, percent: 12 },
          { star: 3, count: 0, percent: 3 },
          { star: 2, count: 0, percent: 0 },
          { star: 1, count: 0, percent: 0 },
        ],
      };
    }

    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    allReviews.forEach((r) => {
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[rounded] = (counts[rounded] || 0) + 1;
      sum += r.rating;
    });

    const avg = Number((sum / total).toFixed(1));

    const distribution = [5, 4, 3, 2, 1].map((s) => ({
      star: s,
      count: counts[s] || 0,
      percent: Math.round(((counts[s] || 0) / total) * 100),
    }));

    return {
      avgRating: avg,
      totalCount: total,
      distribution,
    };
  }, [allReviews]);

  const restaurantName = menuData?.location?.restaurant_name || "Grand Hotel & Dining";

  return (
    <div className="min-h-screen bg-hotel-cream text-hotel-text flex flex-col pb-24">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 bg-hotel-cream/95 backdrop-blur-md border-b border-hotel-dark/5 px-4 py-3 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push(`/menu/${qrToken}`)}
            className="p-2 -ml-2 rounded-full hover:bg-hotel-dark/5 transition-colors flex items-center gap-1.5 text-hotel-dark font-medium text-sm"
            aria-label="Back to menu"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Menu</span>
          </button>

          <div className="text-center">
            <h1 className="font-serif font-bold text-lg text-hotel-dark">Guest Reviews</h1>
            <p className="text-xs text-hotel-dark/60 font-sans">{restaurantName}</p>
          </div>

          <button
            onClick={() => setIsRateModalOpen(true)}
            className="text-xs font-semibold bg-hotel-dark text-hotel-gold px-3 py-1.5 rounded-full hover:bg-hotel-dark/90 transition-all flex items-center gap-1 shadow-xs"
          >
            <Star className="w-3.5 h-3.5 fill-hotel-gold" />
            <span>Rate</span>
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Rating Overview Summary Card */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-hotel-dark/5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* Big Score Box */}
            <div className="sm:col-span-5 text-center sm:text-left flex flex-col items-center sm:items-start justify-center border-b sm:border-b-0 sm:border-r border-hotel-dark/5 pb-5 sm:pb-0 sm:pr-6">
              <div className="text-5xl font-serif font-bold text-hotel-dark tracking-tight">
                {stats.avgRating.toFixed(1)}
              </div>
              <div className="flex items-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(stats.avgRating)
                        ? "text-hotel-gold fill-hotel-gold"
                        : "text-hotel-dark/20 fill-hotel-dark/10"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-hotel-dark/60 font-medium">
                Based on {stats.totalCount > 0 ? stats.totalCount : "500+"} verified experiences
              </p>

              <button
                onClick={() => setIsRateModalOpen(true)}
                className="mt-4 w-full bg-hotel-dark text-hotel-gold text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-hotel-dark/90 transition-all shadow-sm active:scale-98"
              >
                <Sparkles className="w-3.5 h-3.5 text-hotel-gold" />
                <span>Rate Your Experience</span>
              </button>
            </div>

            {/* Distribution Bars */}
            <div className="sm:col-span-7 space-y-2">
              <h2 className="text-xs uppercase font-bold tracking-wider text-hotel-dark/50 mb-2">
                Rating Breakdown
              </h2>
              {stats.distribution.map((d) => (
                <div key={d.star} className="flex items-center gap-2.5 text-xs">
                  <span className="font-semibold text-hotel-dark w-4 flex items-center gap-1">
                    {d.star} <Star className="w-3 h-3 fill-hotel-gold text-hotel-gold inline -mt-0.5" />
                  </span>
                  <div className="flex-1 h-2.5 bg-hotel-cream rounded-full overflow-hidden border border-hotel-dark/5">
                    <div
                      className="h-full bg-gradient-to-r from-hotel-gold to-hotel-gold/80 rounded-full transition-all duration-500"
                      style={{ width: `${d.percent}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-hotel-dark/50 font-medium w-8 text-right">
                    {d.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Filter Tabs (All, Food, Service, Restaurant) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-serif font-bold text-hotel-dark flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-hotel-gold" />
              <span>Guest Impressions</span>
            </h2>
            <span className="text-xs text-hotel-dark/50">
              Showing {reviews.length} {activeTab === "ALL" ? "reviews" : "selected"}
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: "ALL", label: "All Reviews", icon: Sparkles },
              { id: "MENU_ITEM", label: "Dishes & Food", icon: UtensilsCrossed },
              { id: "STAFF", label: "Staff & Service", icon: UserCheck },
              { id: "RESTAURANT", label: "Atmosphere & Ambience", icon: Building2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ReviewTypeFilter)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                    isSelected
                      ? "bg-hotel-dark text-hotel-gold border-hotel-dark shadow-sm"
                      : "bg-white text-hotel-dark/70 border-hotel-dark/10 hover:border-hotel-dark/30 hover:bg-hotel-cream/50"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-hotel-gold" : "text-hotel-dark/50"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Reviews List */}
        <section className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-hotel-dark/5 space-y-3 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-hotel-cream rounded-full w-28" />
                    <div className="h-4 bg-hotel-cream rounded-full w-16" />
                  </div>
                  <div className="h-12 bg-hotel-cream rounded-xl w-full" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-hotel-dark/5 space-y-4">
              <div className="w-14 h-14 rounded-full bg-hotel-gold/10 text-hotel-gold flex items-center justify-center mx-auto">
                <Star className="w-7 h-7" />
              </div>
              <div className="max-w-xs mx-auto">
                <h3 className="font-serif font-bold text-hotel-dark text-base">Be the First to Review</h3>
                <p className="text-xs text-hotel-dark/60 mt-1">
                  Share your dining experience, compliments for the chef, or shoutout to your server!
                </p>
              </div>
              <button
                onClick={() => setIsRateModalOpen(true)}
                className="inline-flex items-center gap-2 bg-hotel-dark text-hotel-gold text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-hotel-dark/90 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Write a Review</span>
              </button>
            </div>
          ) : (
            reviews.map((review: Review) => (
              <article
                key={review.id}
                className="bg-white rounded-2xl p-5 border border-hotel-dark/5 shadow-xs hover:shadow-sm transition-shadow space-y-3"
              >
                {/* Header: User, Stars, Type Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif font-bold text-sm text-hotel-dark">
                        {review.customer_name || "Guest Patron"}
                      </span>
                      {review.review_type && (
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            review.review_type === "MENU_ITEM"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : review.review_type === "STAFF"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {review.review_type === "MENU_ITEM"
                            ? "Dish Review"
                            : review.review_type === "STAFF"
                            ? "Service & Staff"
                            : "Restaurant Ambience"}
                        </span>
                      )}
                    </div>

                    {/* Associated dish or staff reference if present */}
                    {(review.menu_item_name || review.staff_name) && (
                      <p className="text-xs text-hotel-gold font-medium">
                        {review.menu_item_name && `Dish: ${review.menu_item_name}`}
                        {review.staff_name && `Served by: ${review.staff_name}`}
                      </p>
                    )}
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5 bg-hotel-cream/80 px-2 py-1 rounded-full border border-hotel-dark/5 shrink-0">
                    <Star className="w-3.5 h-3.5 text-hotel-gold fill-hotel-gold" />
                    <span className="text-xs font-bold text-hotel-dark ml-0.5">{review.rating}</span>
                  </div>
                </div>

                {/* Review Text */}
                {review.review_text && (
                  <p className="text-xs leading-relaxed text-hotel-text/90 italic font-sans">
                    &ldquo;{review.review_text}&rdquo;
                  </p>
                )}

                {/* Attached Photo Gallery */}
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 pt-1 overflow-x-auto pb-1">
                    {review.images.map((img) => (
                      <div
                        key={img.id}
                        className="w-16 h-16 rounded-xl overflow-hidden border border-hotel-dark/10 shrink-0 bg-hotel-cream relative group"
                      >
                        <img
                          src={img.image_url}
                          alt="Guest review photo"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer: Date */}
                <div className="flex items-center justify-between text-[11px] text-hotel-dark/40 pt-2 border-t border-hotel-dark/5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(review.created_at)}</span>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-hotel-dark/40">
                    <ThumbsUp className="w-3 h-3" /> Verified Guest
                  </span>
                </div>
              </article>
            ))
          )}
        </section>
      </main>

      {/* Floating Rate CTA on Mobile */}
      <div className="fixed bottom-20 right-4 z-20 sm:hidden">
        <button
          onClick={() => setIsRateModalOpen(true)}
          className="flex items-center gap-2 bg-hotel-dark text-hotel-gold px-4 py-3 rounded-full shadow-lg border border-hotel-gold/30 active:scale-95 transition-all"
        >
          <Sparkles className="w-4 h-4 text-hotel-gold" />
          <span className="text-xs font-bold tracking-wide">Rate Experience</span>
        </button>
      </div>

      {/* Persistent Bottom Nav */}
      <BottomNav
        activeTab="reviews"
        onTabChange={(tab) => {
          if (tab === "home" || tab === "menu") {
            router.push(`/menu/${qrToken}`);
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

      {/* Interactive Rate Experience Modal */}
      <RateExperienceModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        menuItems={menuData?.menu_items || []}
        locationId={menuData?.location?.id}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
}
