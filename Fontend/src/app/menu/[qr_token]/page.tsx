"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCw, QrCode } from "lucide-react";
import { Header } from "@/components/header/Header";
import { HeroBanner } from "@/components/hero/HeroBanner";
import { SearchBar } from "@/components/menu/SearchBar";
import { FilterModal, FilterState } from "@/components/menu/FilterModal";
import { CategoryNav } from "@/components/categories/CategoryNav";
import { PopularDishes } from "@/components/menu/PopularDishes";
import { MenuSection } from "@/components/menu/MenuSection";
import { ItemDetailModal } from "@/components/menu/ItemDetailModal";
import { ReviewSection } from "@/components/reviews/ReviewSection";
import { RateExperienceModal } from "@/components/reviews/RateExperienceModal";
import { RestaurantInfo } from "@/components/restaurant/RestaurantInfo";
import { BottomNav, BottomNavTab } from "@/components/navigation/BottomNav";
import { MobileSearchModal } from "@/components/menu/MobileSearchModal";
import { MoreDrawer } from "@/components/navigation/MoreDrawer";
import { FullMenuSkeleton } from "@/components/common/LoadingSkeleton";
import { menuService } from "@/services/menu";
import { reviewService } from "@/services/reviews";
import { restaurantService } from "@/services/restaurant";
import { useCustomerWebSocket } from "@/components/providers/WebSocketProvider";
import { MenuItem, Category, Banner } from "@/types";
import { DEFAULT_RESTAURANT } from "@/lib/constants";
import { applyThemeColors } from "@/lib/theme";

export default function CustomerMenuPage() {
  const params = useParams();
  const router = useRouter();
  const qrToken = typeof params?.qr_token === "string" ? params.qr_token : "";

  const { setActiveToken } = useCustomerWebSocket();

  // Register token for real-time WebSocket live stock sync
  useEffect(() => {
    if (qrToken) {
      setActiveToken(qrToken);
    }
  }, [qrToken, setActiveToken]);

  // Fetch full digital menu for this QR location
  const {
    data: menuData,
    isLoading: isLoadingMenu,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["customer-menu", qrToken],
    queryFn: () => menuService.getMenuByToken(qrToken),
    enabled: !!qrToken,
    staleTime: 1000 * 60 * 2,
  });

  // Fetch guest reviews for testimonial section
  const { data: reviewsResponse } = useQuery({
    queryKey: ["customer-reviews"],
    queryFn: () => reviewService.getReviews({ limit: 6 }),
  });

  // Dynamically apply restaurant brand theme colors
  useEffect(() => {
    if (menuData?.location) {
      applyThemeColors(
        menuData.location.primary_color,
        menuData.location.secondary_color,
        menuData.location.accent_color
      );
    }
  }, [menuData?.location]);

  // State: Navigation & Modals
  const [activeNavTab, setActiveNavTab] = useState<BottomNavTab>("home");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<MenuItem | null>(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [preselectedDishForRate, setPreselectedDishForRate] = useState<MenuItem | null>(null);

  // Sync selected item with live real-time stock updates
  useEffect(() => {
    if (selectedItemForDetail && menuData?.menu_items) {
      const current = menuData.menu_items.find((i) => i.id === selectedItemForDetail.id);
      if (current && current.is_available !== selectedItemForDetail.is_available) {
        setSelectedItemForDetail(current);
      }
    }
  }, [menuData?.menu_items, selectedItemForDetail]);

  // Check URL query for direct search trigger from other views
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("search") === "open" || urlParams.get("focusSearch") === "true") {
        setIsSearchModalOpen(true);
        setActiveNavTab("search");
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);

  // State: Category & Search & Filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const isSearchActive = debouncedSearchQuery.length > 0;

  // Search API query with SQL LIKE matching
  const {
    data: searchApiItems,
    isLoading: isSearchingDishes,
    isFetching: isFetchingSearch,
  } = useQuery({
    queryKey: ["menu-search-dishes", qrToken, debouncedSearchQuery, selectedCategoryId],
    queryFn: () =>
      menuService.searchMenuItems({
        search: debouncedSearchQuery,
        qr_token: qrToken,
        category_id: selectedCategoryId || undefined,
        limit: 100,
      }),
    enabled: isSearchActive,
    staleTime: 1000 * 30,
  });

  const [filters, setFilters] = useState<FilterState>({
    availableOnly: false,
    onlyPopular: false,
    onlyBestseller: false,
    onlyFeatured: false,
    minRating: null,
    priceRange: "all",
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.availableOnly) count++;
    if (filters.onlyPopular) count++;
    if (filters.onlyBestseller) count++;
    if (filters.onlyFeatured) count++;
    if (filters.minRating !== null) count++;
    if (filters.priceRange !== "all") count++;
    return count;
  }, [filters]);

  const [activeQuickFilter, setActiveQuickFilter] = useState<string>("all");

  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setSelectedCategoryId(null);
    setActiveQuickFilter("all");
    setFilters({
      availableOnly: false,
      onlyPopular: false,
      onlyBestseller: false,
      onlyFeatured: false,
      minRating: null,
      priceRange: "all",
    });
  };

  const handleQuickFilter = (type: "veg" | "bestseller" | "popular" | "topRated" | "all") => {
    setActiveQuickFilter(type);
    if (type === "all") {
      setFilters((prev) => ({
        ...prev,
        onlyPopular: false,
        onlyBestseller: false,
        minRating: null,
      }));
    } else if (type === "bestseller") {
      setFilters((prev) => ({
        ...prev,
        onlyBestseller: true,
        onlyPopular: false,
        minRating: null,
      }));
    } else if (type === "popular") {
      setFilters((prev) => ({
        ...prev,
        onlyPopular: true,
        onlyBestseller: false,
        minRating: null,
      }));
    } else if (type === "topRated") {
      setFilters((prev) => ({
        ...prev,
        minRating: 4.5,
      }));
    }
  };

  // Filter and Search Dishes
  const filteredItems = useMemo(() => {
    if (!menuData?.menu_items) return [];

    let list = menuData.menu_items;

    // If search API returned items for active search query, use those as the primary base list
    if (isSearchActive && searchApiItems) {
      list = searchApiItems;
    } else {
      // Filter by category
      if (selectedCategoryId !== null) {
        list = list.filter((item) => item.category_id === selectedCategoryId);
      }

      // Filter by search keyword client-side fallback
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        list = list.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q) ||
            item.short_description?.toLowerCase().includes(q) ||
            item.tags?.toLowerCase().includes(q) ||
            item.category_name?.toLowerCase().includes(q)
        );
      }
    }

    // Availability filter
    if (filters.availableOnly) {
      list = list.filter((item) => item.is_available);
    }

    // Badges filters
    if (filters.onlyPopular) {
      list = list.filter((item) => item.is_popular);
    }
    if (filters.onlyBestseller) {
      list = list.filter((item) => item.is_bestseller);
    }
    if (filters.onlyFeatured) {
      list = list.filter((item) => item.is_featured);
    }

    // Min rating filter
    if (filters.minRating !== null) {
      list = list.filter((item) => item.rating >= (filters.minRating as number));
    }

    // Price range filter
    if (filters.priceRange === "under_15") {
      list = list.filter((item) => item.price < 15);
    } else if (filters.priceRange === "15_30") {
      list = list.filter((item) => item.price >= 15 && item.price <= 30);
    } else if (filters.priceRange === "above_30") {
      list = list.filter((item) => item.price > 30);
    }

    // Vegetarian quick filter
    if (activeQuickFilter === "veg") {
      list = list.filter((item) => item.is_vegetarian || (item.tags?.toLowerCase().includes("veg") && !item.tags?.toLowerCase().includes("non")));
    }

    return list;
  }, [menuData?.menu_items, selectedCategoryId, searchQuery, isSearchActive, searchApiItems, filters, activeQuickFilter]);

  // Loading Skeleton
  if (isLoadingMenu) {
    return (
      <div className="min-h-screen bg-[#F8F7F3]">
        <FullMenuSkeleton />
      </div>
    );
  }

  // Error / Invalid QR Token
  if (isError || !menuData) {
    return (
      <div className="min-h-screen bg-[#F8F7F3] flex items-center justify-center p-6 text-center">
        <div className="bg-white rounded-3xl border border-surface-border p-8 max-w-md w-full shadow-card space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <QrCode className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-bold text-brand-950">
              Menu Not Found
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              The QR code you scanned is invalid, expired, or has been deactivated by restaurant management.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs shadow-md transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { location, categories = [], banners = [], popular_items = [] } = menuData;
  const currency = location?.currency || "OMR ";
  const reviews = reviewsResponse?.data || [];

  // Build restaurant info dynamically: name comes from the API (admin-editable),
  // other branding fields fall back to the configured defaults.
  const restaurant = {
    ...DEFAULT_RESTAURANT,
    name: location?.restaurant_name || location?.name || DEFAULT_RESTAURANT.name,
    logo_url: location?.logo_url,
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] pb-24 sm:pb-12 text-[#17201B] overflow-x-hidden w-full">
      {/* Sticky Header */}
      <Header
        restaurant={restaurant}
        location={location}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenRate={() => {
          setPreselectedDishForRate(null);
          setIsRateModalOpen(true);
        }}
        qrToken={qrToken}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-8 overflow-x-hidden w-full">
        {/* Search Bar & Filter trigger */}
        <section id="search-section" className="scroll-mt-20">
          <SearchBar
            query={searchQuery}
            onChange={setSearchQuery}
            onOpenFilter={() => setIsFilterModalOpen(true)}
            activeFilterCount={activeFilterCount}
            isLoading={isSearchActive && (isSearchingDishes || isFetchingSearch)}
            onQuickFilter={handleQuickFilter}
            activeQuickFilter={activeQuickFilter}
          />
        </section>

        {/* Hero Promotional Banner (Hidden during deep keyword search to avoid distraction) */}
        {!searchQuery && banners.length > 0 && (
          <section>
            <HeroBanner banners={banners} />
          </section>
        )}

        {/* Horizontal Category Carousel Navigation */}
        <section>
          <CategoryNav
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={(id) => {
              if (id !== null) {
                router.push(`/menu/${qrToken}/category/${id}`);
              } else {
                setSelectedCategoryId(null);
                setSearchQuery("");
              }
            }}
          />
        </section>

        {/* Popular Dishes Carousel (Displayed when no active filters) */}
        {!searchQuery && selectedCategoryId === null && activeFilterCount === 0 && (
          <section>
            <PopularDishes
              items={popular_items}
              currency={currency}
              onSelectDish={(item) => setSelectedItemForDetail(item)}
              onViewAllClick={() => {
                setFilters((prev) => ({ ...prev, onlyPopular: true }));
                const el = document.getElementById("menu-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            />
          </section>
        )}

        {/* Primary Menu Grid Section */}
        <MenuSection
          items={filteredItems}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          searchQuery={searchQuery}
          currency={currency}
          isSearching={isSearchActive && isSearchingDishes && !searchApiItems}
          onSelectItem={(item) => setSelectedItemForDetail(item)}
          onResetFilters={handleResetFilters}
          qrToken={qrToken}
        />

        {/* Guest Reviews Section */}
        <div id="reviews-section" className="scroll-mt-20">
          <ReviewSection
            reviews={reviews}
            onOpenRateModal={() => {
              setPreselectedDishForRate(null);
              setIsRateModalOpen(true);
            }}
            qrToken={qrToken}
          />
        </div>

        {/* Restaurant Profile Information */}
        <section>
          <RestaurantInfo restaurant={restaurant} />
        </section>
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <BottomNav
        activeTab={isSearchModalOpen ? "search" : activeNavTab}
        onTabChange={(tab) => {
          if (tab === "search") {
            setIsSearchModalOpen((prev) => !prev);
          } else {
            setIsSearchModalOpen(false);
            setActiveNavTab(tab);
            if (tab === "more") setIsDrawerOpen(true);
          }
        }}
        onSearchClick={() => setIsSearchModalOpen((prev) => !prev)}
        qrToken={qrToken}
      />

      {/* Slide-out More / Info Drawer */}
      <MoreDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        restaurant={restaurant}
        location={location}
        onOpenRateModal={() => {
          setPreselectedDishForRate(null);
          setIsRateModalOpen(true);
        }}
        qrToken={qrToken}
      />

      {/* Mobile Thumb-Friendly Search Modal */}
      <MobileSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => {
          setIsSearchModalOpen(false);
          if (activeNavTab === "search") {
            setActiveNavTab("home");
          }
        }}
        items={menuData.menu_items || []}
        categories={categories}
        currency={currency}
        onSelectItem={(item) => {
          setIsSearchModalOpen(false);
          setSelectedItemForDetail(item);
        }}
        onApplySearchToMenu={(query, catId) => {
          setSearchQuery(query);
          if (catId !== undefined && catId !== null) {
            setSelectedCategoryId(catId);
          }
          setIsSearchModalOpen(false);
          setActiveNavTab("menu");
          const el = document.getElementById("menu-section");
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          }
        }}
        initialQuery={searchQuery}
        qrToken={qrToken}
      />

      {/* Filter Modal / Bottom Sheet */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        currency={currency}
        onChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* Dish Inspection Detail Modal */}
      {selectedItemForDetail && (
        <ItemDetailModal
          item={selectedItemForDetail}
          currency={currency}
          onClose={() => setSelectedItemForDetail(null)}
          onRateDish={(dish) => {
            setPreselectedDishForRate(dish);
            setIsRateModalOpen(true);
          }}
        />
      )}

      {/* Rate Experience Modal (Food, Server, Restaurant) */}
      <RateExperienceModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        menuItems={menuData.menu_items || []}
        preselectedItem={preselectedDishForRate}
        locationId={location?.id || null}
        currency={currency}
      />
    </div>
  );
}
