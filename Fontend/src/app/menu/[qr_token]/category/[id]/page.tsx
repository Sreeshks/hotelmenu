"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Star,
  Flame,
  Award,
  Sparkles,
  Clock,
  Search,
  X,
  ChevronRight,
  LayoutGrid,
  ListFilter,
  Utensils,
  Share2,
  Check,
  Building,
  Menu as MenuIcon,
  Filter,
} from "lucide-react";
import { menuService } from "@/services/menu";
import { MenuItem, Category } from "@/types";
import { DEFAULT_RESTAURANT } from "@/lib/constants";
import { resolveImageUrl, formatPrice } from "@/lib/utils";
import { applyThemeColors } from "@/lib/theme";
import { MenuCard } from "@/components/menu/MenuCard";
import { ItemDetailModal } from "@/components/menu/ItemDetailModal";
import { RateExperienceModal } from "@/components/reviews/RateExperienceModal";
import { MoreDrawer } from "@/components/navigation/MoreDrawer";
import { BottomNav, BottomNavTab } from "@/components/navigation/BottomNav";
import { MobileSearchModal } from "@/components/menu/MobileSearchModal";

type DietaryFilter = "all" | "veg" | "nonveg" | "bestseller" | "popular" | "topRated";
type SortOption = "default" | "price_asc" | "price_desc" | "rating_desc";

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qrToken = typeof params?.qr_token === "string" ? params.qr_token : "";
  const categoryIdParam = typeof params?.id === "string" ? Number(params.id) : 0;

  // Modals & Navigation state
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<MenuItem | null>(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Filters & Search state within this category
  const [inCategorySearch, setInCategorySearch] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState<DietaryFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch full restaurant digital menu
  const { data: menuData, isLoading } = useQuery({
    queryKey: ["customer-menu", qrToken],
    queryFn: () => menuService.getMenuByToken(qrToken),
    enabled: !!qrToken,
    staleTime: 1000 * 60 * 3,
  });

  // Apply restaurant brand theme colors
  useEffect(() => {
    if (menuData?.location) {
      applyThemeColors(
        menuData.location.primary_color,
        menuData.location.secondary_color,
        menuData.location.accent_color
      );
    }
  }, [menuData?.location]);

  // Current category & dishes
  const categories = menuData?.categories || [];
  const allMenuItems = menuData?.menu_items || [];
  const currentCategory = categories.find((c) => c.id === categoryIdParam);
  const categoryDishes = useMemo(() => {
    return allMenuItems.filter((item) => item.category_id === categoryIdParam);
  }, [allMenuItems, categoryIdParam]);

  // Category Statistics breakdown
  const categoryStats = useMemo(() => {
    const total = categoryDishes.length;
    if (total === 0) return { total: 0, vegCount: 0, nonVegCount: 0, avgRating: 5.0, minPrice: 0, maxPrice: 0 };

    let vegCount = 0;
    let totalRating = 0;
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    categoryDishes.forEach((item) => {
      const isVeg = item.is_vegetarian ?? (item.tags?.toLowerCase().includes("veg") && !item.tags?.toLowerCase().includes("non"));
      if (isVeg) vegCount++;
      totalRating += item.rating > 0 ? item.rating : 5.0;
      if (item.price < minPrice) minPrice = item.price;
      if (item.price > maxPrice) maxPrice = item.price;
    });

    return {
      total,
      vegCount,
      nonVegCount: total - vegCount,
      avgRating: (totalRating / total).toFixed(1),
      minPrice: minPrice === Infinity ? 0 : minPrice,
      maxPrice: maxPrice === -Infinity ? 0 : maxPrice,
    };
  }, [categoryDishes]);

  // Filter & Sort dishes in this category
  const filteredDishes = useMemo(() => {
    let list = [...categoryDishes];

    // Search query filter
    const q = inCategorySearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.short_description?.toLowerCase().includes(q) ||
          item.tags?.toLowerCase().includes(q)
      );
    }

    // Dietary & popularity filters
    if (dietaryFilter === "veg") {
      list = list.filter((item) => item.is_vegetarian || (item.tags?.toLowerCase().includes("veg") && !item.tags?.toLowerCase().includes("non")));
    } else if (dietaryFilter === "nonveg") {
      list = list.filter((item) => !item.is_vegetarian && !item.tags?.toLowerCase().includes("veg"));
    } else if (dietaryFilter === "bestseller") {
      list = list.filter((item) => item.is_bestseller);
    } else if (dietaryFilter === "popular") {
      list = list.filter((item) => item.is_popular);
    } else if (dietaryFilter === "topRated") {
      list = list.filter((item) => item.rating >= 4.5);
    }

    // Sorting
    if (sortBy === "price_asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating_desc") {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }, [categoryDishes, inCategorySearch, dietaryFilter, sortBy]);

  const currency = menuData?.location?.currency || "OMR ";
  const restaurantName = menuData?.location?.restaurant_name || menuData?.location?.name || DEFAULT_RESTAURANT.name;

  const handleShare = () => {
    if (typeof window !== "undefined") {
      if (navigator.share) {
        navigator.share({
          title: `${currentCategory?.name || "Category"} - ${restaurantName}`,
          text: `Explore ${currentCategory?.name} dishes at ${restaurantName}`,
          url: window.location.href,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F7F3] p-4 sm:p-8 space-y-6 animate-pulse">
        <div className="h-14 bg-white rounded-2xl w-full border border-stone-200/80" />
        <div className="h-48 sm:h-64 bg-stone-200 rounded-3xl w-full" />
        <div className="h-10 bg-white rounded-full w-3/4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 bg-white rounded-3xl border border-stone-200/80" />
          ))}
        </div>
      </div>
    );
  }

  // Not found
  if (!currentCategory && !isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F7F3] flex items-center justify-center p-6 text-center">
        <div className="bg-white rounded-3xl border border-stone-200/80 p-8 max-w-md w-full shadow-card space-y-4">
          <Utensils className="w-12 h-12 text-gold-600 mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-brand-950">Category Not Found</h2>
          <p className="text-xs text-stone-500">
            This category is not available or has been removed from the digital menu.
          </p>
          <Link
            href={`/menu/${qrToken}`}
            className="inline-flex items-center gap-2 py-3 px-5 rounded-2xl bg-brand-900 text-white font-semibold text-xs shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Menu</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F3] pb-24 sm:pb-12 text-[#17201B] overflow-x-hidden w-full">
      {/* Sticky Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#F8F7F3]/95 backdrop-blur-md border-b border-stone-200/70 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Back to main menu */}
          <Link
            href={`/menu/${qrToken}`}
            className="inline-flex items-center gap-2 text-xs font-bold text-brand-900 hover:text-gold-600 py-1.5 px-3 rounded-full bg-white border border-stone-200/80 shadow-2xs transition-all active:scale-95"
            aria-label="Back to full menu"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">All Menu</span>
            <span className="sm:hidden">Menu</span>
          </Link>

          {/* Center Category Title */}
          <div className="text-center min-w-0 flex-1 px-2">
            <h1 className="font-serif font-bold text-sm sm:text-base text-brand-950 truncate">
              {currentCategory?.name}
            </h1>
            <p className="text-[10px] text-stone-500 truncate">
              {restaurantName}
            </p>
          </div>

          {/* Action buttons (Share & Drawer) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-stone-200/80 text-brand-900 hover:border-gold-400 flex items-center justify-center transition-all shadow-2xs active:scale-95"
              title="Share category"
              aria-label="Share category"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setIsMoreDrawerOpen(true)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-stone-200/80 text-brand-900 hover:border-gold-400 flex items-center justify-center transition-all shadow-2xs active:scale-95"
              title="Restaurant info"
              aria-label="Open menu drawer"
            >
              <MenuIcon className="w-4 h-4 text-brand-900" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-6">
        {/* Category Hero Showcase Banner */}
        <section className="relative rounded-3xl overflow-hidden shadow-card border border-stone-200/80 bg-brand-950 text-white min-h-[190px] sm:min-h-[230px] flex flex-col justify-end p-5 sm:p-8">
          {/* Background image if available */}
          {currentCategory?.image ? (
            <Image
              src={resolveImageUrl(currentCategory.image)}
              alt={currentCategory.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1200px"
              className="object-cover opacity-45 mix-blend-overlay"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-850 opacity-90" />
          )}

          {/* Luxury ambient gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/70 to-transparent z-10" />

          {/* Banner Content */}
          <div className="relative z-20 space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-gold-400 font-serif text-xs">✦</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-gold-300">
                Culinary Category
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              {currentCategory?.name}
            </h1>

            {currentCategory?.description && (
              <p className="text-xs sm:text-sm text-stone-300 font-serif italic leading-relaxed line-clamp-2">
                {currentCategory.description}
              </p>
            )}

            {/* Metric Pills inside Hero */}
            <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
              <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-gold-300 font-bold flex items-center gap-1 shadow-2xs">
                <span>✦</span>
                <span>{categoryStats.total} {categoryStats.total === 1 ? "Dish" : "Dishes"}</span>
              </span>

              {categoryStats.vegCount > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 backdrop-blur-md border border-emerald-500/30 text-emerald-300 font-semibold flex items-center gap-1 shadow-2xs">
                  <span className="diet-badge-veg w-2.5 h-2.5" />
                  <span>{categoryStats.vegCount} Veg</span>
                </span>
              )}

              {categoryStats.nonVegCount > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-rose-950/60 backdrop-blur-md border border-rose-500/30 text-rose-300 font-semibold flex items-center gap-1 shadow-2xs">
                  <span className="diet-badge-nonveg w-2.5 h-2.5" />
                  <span>{categoryStats.nonVegCount} Non-Veg</span>
                </span>
              )}

              <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-stone-200 font-semibold flex items-center gap-1">
                <Star className="w-3 h-3 fill-gold-400 text-gold-400" />
                <span>{categoryStats.avgRating} Rating</span>
              </span>

              {categoryStats.minPrice > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-gold-200 font-serif">
                  From {formatPrice(categoryStats.minPrice, currency)}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Sticky Category Switcher Bar (Instantly switch between categories) */}
        {categories.length > 1 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Explore Other Categories
              </span>
              <span className="text-[10px] text-stone-400">
                {categories.length} categories
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
              {categories.map((cat) => {
                const isActive = cat.id === categoryIdParam;
                return (
                  <Link
                    key={cat.id}
                    href={`/menu/${qrToken}/category/${cat.id}`}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 shadow-2xs active:scale-95 ${
                      isActive
                        ? "bg-brand-900 text-gold-300 border border-gold-400/50 shadow-sm ring-2 ring-gold-400/30"
                        : "bg-white text-stone-700 border border-stone-200/90 hover:border-gold-300 hover:text-brand-950"
                    }`}
                  >
                    <span>{cat.name}</span>
                    {cat.item_count !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-gold-500/30 text-gold-200" : "bg-stone-100 text-stone-500"}`}>
                        {cat.item_count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* In-Category Search & Filters Toolbar */}
        <section className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-xs space-y-3.5">
          {/* Search bar inside this category */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={inCategorySearch}
              onChange={(e) => setInCategorySearch(e.target.value)}
              placeholder={`Search in ${currentCategory?.name || "this category"}...`}
              className="w-full pl-11 pr-10 py-3 bg-stone-50 border border-stone-200/80 rounded-2xl text-xs sm:text-sm text-brand-950 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-gold-500 focus:ring-4 focus:ring-gold-400/20 transition-all"
            />
            {inCategorySearch && (
              <button
                onClick={() => setInCategorySearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 flex items-center justify-center transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Dietary and Status Filter Chips */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: "all", label: "All", icon: "✦" },
                { id: "veg", label: "Vegetarian", icon: "🌿" },
                { id: "nonveg", label: "Non-Veg", icon: "🍗" },
                { id: "bestseller", label: "Bestsellers", icon: "⭐" },
                { id: "popular", label: "Popular", icon: "🔥" },
                { id: "topRated", label: "Top Rated", icon: "✨" },
              ].map((f) => {
                const isActive = dietaryFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setDietaryFilter(f.id as DietaryFilter)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                      isActive
                        ? "bg-brand-900 text-gold-300 border border-gold-500/50 shadow-xs"
                        : "bg-stone-100 text-stone-600 border border-stone-200/60 hover:text-stone-900 hover:bg-stone-200/60"
                    }`}
                  >
                    <span className="text-xs">{f.icon}</span>
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>

            {/* View Mode Toggle (Grid vs Editorial List) */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/80 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-brand-950 shadow-2xs font-bold"
                    : "text-stone-500 hover:text-stone-800"
                }`}
                title="Grid View"
                aria-label="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-white text-brand-950 shadow-2xs font-bold"
                    : "text-stone-500 hover:text-stone-800"
                }`}
                title="Editorial List View"
                aria-label="List View"
              >
                <ListFilter className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* Results Counter & Sort Dropdown */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-semibold text-stone-500">
            Showing <strong className="text-brand-950">{filteredDishes.length}</strong> of {categoryDishes.length} {categoryDishes.length === 1 ? "dish" : "dishes"}
          </p>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-stone-400 hidden sm:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs font-medium text-brand-950 bg-white border border-stone-200/80 rounded-xl px-2.5 py-1 focus:outline-none focus:border-gold-500 shadow-2xs cursor-pointer"
            >
              <option value="default">Recommended</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Dishes Grid / List Display */}
        {filteredDishes.length === 0 ? (
          <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-stone-200/80 p-8 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Utensils className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-stone-800 text-base">
                No matching dishes found
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                No dishes match your active filter or search keyword in &quot;{currentCategory?.name}&quot;.
              </p>
            </div>
            <button
              onClick={() => {
                setInCategorySearch("");
                setDietaryFilter("all");
                setSortBy("default");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-900 text-white rounded-xl text-xs font-semibold hover:bg-brand-950 transition-colors shadow-xs active:scale-95"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View: Responsive cards showcasing photo, badges, price, details */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredDishes.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                currency={currency}
                onClick={(selected) => setSelectedItemForDetail(selected)}
              />
            ))}
          </div>
        ) : (
          /* Editorial List View: Compact row items */
          <div className="space-y-3">
            {filteredDishes.map((item) => {
              const isVeg = item.is_vegetarian ?? (item.tags?.toLowerCase().includes("veg") && !item.tags?.toLowerCase().includes("non"));
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemForDetail(item)}
                  className="bg-white rounded-2xl p-4 border border-stone-200/80 hover:border-gold-400/50 hover:shadow-cardHover transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 group active:scale-[0.99]"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={isVeg ? "diet-badge-veg w-3.5 h-3.5 shrink-0" : "diet-badge-nonveg w-3.5 h-3.5 shrink-0"} />
                      <h3 className="font-serif text-base font-bold text-brand-950 group-hover:text-gold-600 transition-colors truncate">
                        {item.name}
                      </h3>
                      {item.is_bestseller && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold-100 text-gold-800 shrink-0">
                          ★ Best
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-text-secondary line-clamp-1 leading-relaxed">
                      {item.short_description || item.description || "Artisanal culinary preparation."}
                    </p>

                    <div className="flex items-center gap-3 pt-0.5">
                      <span className="font-serif text-base font-bold text-brand-900">
                        {formatPrice(item.price, currency)}
                      </span>
                      {item.rating > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-gold-600 font-semibold">
                          <Star className="w-3 h-3 fill-gold-500 text-gold-500" />
                          <span>{item.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Thumbnail */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200/60">
                    <img
                      src={resolveImageUrl(item.image_url)}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    />
                    {!item.is_available && (
                      <div className="absolute inset-0 bg-stone-950/70 flex items-center justify-center p-1 text-center">
                        <span className="text-[9px] font-bold text-gold-300 uppercase">Sold Out</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Persistent Mobile Bottom Navigation */}
      <BottomNav
        activeTab="menu"
        onTabChange={(tab) => {
          if (tab === "home") {
            router.push(`/menu/${qrToken}`);
          } else if (tab === "search") {
            setIsSearchModalOpen(true);
          } else if (tab === "reviews") {
            router.push(`/menu/${qrToken}/reviews`);
          } else if (tab === "more") {
            setIsMoreDrawerOpen(true);
          }
        }}
        onSearchClick={() => setIsSearchModalOpen(true)}
        qrToken={qrToken}
      />

      {/* Item Detail Modal */}
      {selectedItemForDetail && (
        <ItemDetailModal
          item={selectedItemForDetail}
          currency={currency}
          onClose={() => setSelectedItemForDetail(null)}
          onRateDish={(dish) => {
            setSelectedItemForDetail(null);
            setIsRateModalOpen(true);
          }}
        />
      )}

      {/* Rate Experience Modal */}
      <RateExperienceModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        menuItems={categoryDishes}
        locationId={menuData?.location?.id || null}
        currency={currency}
      />

      {/* More Info & Concierge Drawer */}
      <MoreDrawer
        isOpen={isMoreDrawerOpen}
        onClose={() => setIsMoreDrawerOpen(false)}
        restaurant={{
          ...DEFAULT_RESTAURANT,
          name: restaurantName,
          logo_url: menuData?.location?.logo_url,
        }}
        location={menuData?.location}
        onOpenRateModal={() => setIsRateModalOpen(true)}
        qrToken={qrToken}
      />

      {/* Mobile Search Bottom Sheet */}
      <MobileSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        items={allMenuItems}
        categories={categories}
        currency={currency}
        onSelectItem={(item) => {
          setIsSearchModalOpen(false);
          setSelectedItemForDetail(item);
        }}
        onApplySearchToMenu={(query, catId) => {
          setIsSearchModalOpen(false);
          if (catId && catId !== categoryIdParam) {
            router.push(`/menu/${qrToken}/category/${catId}`);
          } else {
            setInCategorySearch(query);
          }
        }}
      />
    </div>
  );
}
