"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Gift,
  Flame,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Layers,
  Percent,
  Search,
  Sparkles,
  ArrowRight,
  X,
  AlertCircle,
  PackagePlus,
  Utensils,
  ChevronRight,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useToast } from "@/components/common/Toast";
import { useSettings } from "@/components/providers/SettingsProvider";
import { offersService, SetDailyOfferInput, CreateComboOfferInput } from "@/services/offers";
import { menuService } from "@/services/menu";
import { categoryService } from "@/services/categories";
import { MenuItem, Category, ComboItemDetail } from "@/types";
import { resolveImageUrl, formatPrice } from "@/lib/utils";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function OffersPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { currencySymbol } = useSettings();

  const [activeTab, setActiveTab] = useState<"daily" | "combos">("daily");
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>("All");

  // Modals state
  const [isDailyOfferModalOpen, setIsDailyOfferModalOpen] = useState(false);
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);

  // Daily Offer Form state
  const [selectedDishId, setSelectedDishId] = useState<number | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>(["Monday"]);
  const [offerPrice, setOfferPrice] = useState<string>("");
  const [originalPrice, setOriginalPrice] = useState<string>("");

  // Combo Builder Form state
  const [comboName, setComboName] = useState("");
  const [comboCategoryId, setComboCategoryId] = useState<number>(0);
  const [bundledItems, setBundledItems] = useState<ComboItemDetail[]>([]);
  const [comboPrice, setComboPrice] = useState("");
  const [comboDescription, setComboDescription] = useState("");
  const [comboImageUrl, setComboImageUrl] = useState("");
  const [comboDays, setComboDays] = useState<string[]>([]);
  const [pickerDishId, setPickerDishId] = useState<string>("");

  // Queries
  const { data: menuResponse, isLoading: isLoadingMenu } = useQuery({
    queryKey: ["admin-all-menu-items"],
    queryFn: () => menuService.getMenuItems({ limit: 500 }),
  });
  const allMenuItems = menuResponse?.data || [];

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => categoryService.getCategories(),
  });

  const { data: dailyOffers = [], isLoading: isLoadingOffers, refetch: refetchOffers } = useQuery({
    queryKey: ["admin-daily-offers"],
    queryFn: () => offersService.getDailyOffers(),
  });

  const { data: comboOffers = [], isLoading: isLoadingCombos, refetch: refetchCombos } = useQuery({
    queryKey: ["admin-combo-offers"],
    queryFn: () => offersService.getComboOffers(),
  });

  // Selected dish for daily offer helper
  const selectedDish = useMemo(() => {
    return allMenuItems.find((i) => i.id === selectedDishId);
  }, [allMenuItems, selectedDishId]);

  // When selected dish changes, update default prices
  React.useEffect(() => {
    if (selectedDish) {
      setOriginalPrice(String(selectedDish.original_price || selectedDish.price));
      if (!offerPrice) {
        setOfferPrice(String(Math.round(selectedDish.price * 0.85 * 1000) / 1000));
      }
    }
  }, [selectedDish]);

  // Daily Offer Mutation
  const saveDailyOfferMutation = useMutation({
    mutationFn: (data: SetDailyOfferInput) => offersService.setDailyOffer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-daily-offers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-menu-items"] });
      addToast({
        type: "success",
        title: "Daily Offer Saved",
        message: "Dish offer schedule and promotional price updated successfully.",
      });
      setIsDailyOfferModalOpen(false);
      resetDailyOfferForm();
    },
    onError: () => {
      addToast({
        type: "error",
        title: "Failed to Save Offer",
        message: "An error occurred while updating the daily offer schedule.",
      });
    },
  });

  // Remove Daily Offer Mutation
  const removeDailyOfferMutation = useMutation({
    mutationFn: (itemId: number) => offersService.removeDailyOffer(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-daily-offers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-menu-items"] });
      addToast({
        type: "success",
        title: "Offer Removed",
        message: "Dish restored to regular catalog price.",
      });
    },
  });

  // Create Combo Mutation
  const createComboMutation = useMutation({
    mutationFn: (data: CreateComboOfferInput) => offersService.createComboOffer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-combo-offers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-menu-items"] });
      addToast({
        type: "success",
        title: "Combo Deal Created",
        message: "New combo bundle package added to your restaurant menu.",
      });
      setIsComboModalOpen(false);
      resetComboForm();
    },
    onError: () => {
      addToast({
        type: "error",
        title: "Failed to Create Combo",
        message: "Could not create combo package. Please check required fields.",
      });
    },
  });

  const resetDailyOfferForm = () => {
    setSelectedDishId(null);
    setSelectedDays(["Monday"]);
    setOfferPrice("");
    setOriginalPrice("");
  };

  const resetComboForm = () => {
    setComboName("");
    setComboCategoryId(categories[0]?.id || 0);
    setBundledItems([]);
    setComboPrice("");
    setComboDescription("");
    setComboImageUrl("");
    setComboDays([]);
    setPickerDishId("");
  };

  const handleToggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleToggleComboDay = (day: string) => {
    setComboDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddDishToBundle = (dishId: number) => {
    const dish = allMenuItems.find((d) => d.id === dishId);
    if (!dish) return;

    setBundledItems((prev) => {
      const existing = prev.find((i) => i.id === dish.id);
      if (existing) {
        return prev.map((i) =>
          i.id === dish.id ? { ...i, quantity: (i.quantity || 1) + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: dish.id,
          name: dish.name,
          price: dish.price,
          quantity: 1,
          image_url: dish.image_url,
        },
      ];
    });
    setPickerDishId("");
  };

  const handleUpdateBundleQty = (dishId: number, delta: number) => {
    setBundledItems((prev) =>
      prev
        .map((i) => {
          if (i.id === dishId) {
            const nextQty = (i.quantity || 1) + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean) as ComboItemDetail[]
    );
  };

  const handleRemoveBundleItem = (dishId: number) => {
    setBundledItems((prev) => prev.filter((i) => i.id !== dishId));
  };

  // Calculated bundle total
  const bundledTotalValue = useMemo(() => {
    return bundledItems.reduce(
      (sum, item) => sum + item.price * (item.quantity || 1),
      0
    );
  }, [bundledItems]);

  // Filtered daily offers by day
  const filteredDailyOffers = useMemo(() => {
    if (selectedDayFilter === "All") return dailyOffers;
    return dailyOffers.filter((item) => {
      const days = (item.offer_days || "").toLowerCase();
      return (
        days.includes("all") ||
        days.includes("daily") ||
        days.includes(selectedDayFilter.toLowerCase())
      );
    });
  }, [dailyOffers, selectedDayFilter]);

  const handleSaveDailyOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDishId) {
      addToast({ type: "error", title: "Dish Required", message: "Please select a dish to apply the offer." });
      return;
    }
    if (selectedDays.length === 0) {
      addToast({ type: "error", title: "Select Days", message: "Please select at least one day of the week." });
      return;
    }
    const numOfferPrice = parseFloat(offerPrice);
    if (isNaN(numOfferPrice) || numOfferPrice <= 0) {
      addToast({ type: "error", title: "Invalid Price", message: "Please enter a valid offer price." });
      return;
    }

    saveDailyOfferMutation.mutate({
      item_id: selectedDishId,
      offer_days: selectedDays,
      offer_price: numOfferPrice,
      original_price: originalPrice ? parseFloat(originalPrice) : undefined,
    });
  };

  const handleSaveCombo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comboName.trim()) {
      addToast({ type: "error", title: "Name Required", message: "Please enter a name for the combo package." });
      return;
    }
    if (bundledItems.length === 0) {
      addToast({ type: "error", title: "Items Required", message: "Please add at least one dish to the combo bundle." });
      return;
    }
    const numComboPrice = parseFloat(comboPrice);
    if (isNaN(numComboPrice) || numComboPrice <= 0) {
      addToast({ type: "error", title: "Invalid Price", message: "Please enter a valid combo offer price." });
      return;
    }

    const catId = comboCategoryId || categories[0]?.id;
    if (!catId) {
      addToast({ type: "error", title: "Category Required", message: "Please select a category." });
      return;
    }

    createComboMutation.mutate({
      name: comboName.trim(),
      category_id: catId,
      price: numComboPrice,
      original_price: bundledTotalValue,
      combo_items: bundledItems,
      short_description: comboDescription.trim() || `Bundle includes: ${bundledItems.map((i) => `${i.quantity}x ${i.name}`).join(", ")}`,
      description: comboDescription.trim(),
      image_url: comboImageUrl.trim() || bundledItems[0]?.image_url || undefined,
      offer_days: comboDays.length > 0 ? comboDays : undefined,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl lg:text-3xl font-bold text-brand-950 dark:text-stone-100 flex items-center gap-2.5">
              <Gift className="w-7 h-7 text-gold-500" />
              <span>Offers & Combo Deals</span>
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              Configure weekday-specific specials (Monday, Tuesday...) and package dishes into attractive combo offers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "daily" ? (
              <button
                onClick={() => {
                  resetDailyOfferForm();
                  setIsDailyOfferModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-gold-400" />
                <span>Add Daily Offer</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  resetComboForm();
                  setIsComboModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-950 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <PackagePlus className="w-4 h-4 text-gold-400" />
                <span>Create Combo Deal</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
          <button
            onClick={() => setActiveTab("daily")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "daily"
                ? "bg-brand-950 text-gold-400 shadow-sm"
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Weekday Daily Offers ({dailyOffers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("combos")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "combos"
                ? "bg-brand-950 text-gold-400 shadow-sm"
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Combo Packages ({comboOffers.length})</span>
          </button>
        </div>

        {/* TAB 1: WEEKDAY DAILY OFFERS */}
        {activeTab === "daily" && (
          <div className="space-y-4">
            {/* Day Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedDayFilter("All")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedDayFilter === "All"
                    ? "bg-gold-500 text-brand-950 font-bold shadow-xs"
                    : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-gold-400"
                }`}
              >
                All Days ({dailyOffers.length})
              </button>

              {DAYS_OF_WEEK.map((day) => {
                const count = dailyOffers.filter((item) =>
                  (item.offer_days || "").toLowerCase().includes(day.toLowerCase())
                ).length;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDayFilter(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      selectedDayFilter === day
                        ? "bg-brand-950 text-gold-400 font-bold shadow-xs"
                        : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-brand-700"
                    }`}
                  >
                    <span>{day}</span>
                    {count > 0 && (
                      <span className="w-4 h-4 rounded-full bg-gold-500 text-brand-950 text-[10px] font-bold flex items-center justify-center">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Daily Offers Grid */}
            {isLoadingOffers ? (
              <div className="p-12 text-center text-xs text-stone-400">Loading daily offers...</div>
            ) : filteredDailyOffers.length === 0 ? (
              <div className="bg-white dark:bg-[#121815] rounded-3xl border border-stone-200/80 dark:border-stone-800 p-12 text-center space-y-3">
                <Flame className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto" />
                <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
                  No offers scheduled for {selectedDayFilter === "All" ? "any day" : selectedDayFilter}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                  Click &quot;Add Daily Offer&quot; above to pick any menu item and schedule special prices on specific weekdays.
                </p>
                <button
                  onClick={() => {
                    resetDailyOfferForm();
                    if (selectedDayFilter !== "All") setSelectedDays([selectedDayFilter]);
                    setIsDailyOfferModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-900 text-white text-xs font-bold hover:bg-brand-950 shadow-sm"
                >
                  + Add {selectedDayFilter !== "All" ? `${selectedDayFilter} Offer` : "Offer"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDailyOffers.map((item) => {
                  const hasDiscount = Boolean(item.original_price && item.original_price > item.price);
                  const discountPercent = hasDiscount
                    ? Math.round(((item.original_price! - item.price) / item.original_price!) * 100)
                    : 0;
                  const daysList = (item.offer_days || "All Days").split(",").map((d) => d.trim());

                  return (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-[#121815] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Top: Day Tags & Discount */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex flex-wrap gap-1">
                            {daysList.map((d) => (
                              <span
                                key={d}
                                className="px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-900 dark:text-gold-300 text-[10px] font-bold border border-brand-200/60 dark:border-brand-800"
                              >
                                {d} Special
                              </span>
                            ))}
                          </div>
                          {hasDiscount && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase">
                              {discountPercent}% OFF
                            </span>
                          )}
                        </div>

                        {/* Dish preview */}
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                            {item.image_url ? (
                              <img
                                src={resolveImageUrl(item.image_url)}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400 font-serif text-[10px]">
                                Dish
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold uppercase text-gold-600 block">
                              {item.category_name || "Special"}
                            </span>
                            <h4 className="font-serif text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                              {item.name}
                            </h4>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              {hasDiscount && (
                                <span className="text-xs text-stone-400 line-through">
                                  {formatPrice(item.original_price!, currencySymbol)}
                                </span>
                              )}
                              <span className="font-serif text-base font-bold text-emerald-700 dark:text-emerald-400">
                                {formatPrice(item.price, currencySymbol)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 mt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                        <span className="text-[11px] text-stone-400">
                          Active on {daysList.length} {daysList.length === 1 ? "day" : "days"}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedDishId(item.id);
                              setSelectedDays(daysList);
                              setOfferPrice(String(item.price));
                              setOriginalPrice(String(item.original_price || item.price));
                              setIsDailyOfferModalOpen(true);
                            }}
                            className="p-1.5 text-stone-500 hover:text-brand-900 dark:hover:text-stone-200 transition-colors"
                            title="Edit schedule & price"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove daily offer from "${item.name}" and restore regular price?`)) {
                                removeDailyOfferMutation.mutate(item.id);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:text-rose-700 transition-colors"
                            title="Remove offer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COMBO OFFERS BUILDER */}
        {activeTab === "combos" && (
          <div className="space-y-4">
            {isLoadingCombos ? (
              <div className="p-12 text-center text-xs text-stone-400">Loading combo offers...</div>
            ) : comboOffers.length === 0 ? (
              <div className="bg-white dark:bg-[#121815] rounded-3xl border border-stone-200/80 dark:border-stone-800 p-12 text-center space-y-3">
                <Layers className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto" />
                <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
                  No combo packages created yet
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                  Click &quot;Create Combo Deal&quot; to pick dishes from your existing menu and bundle them together into a meal package.
                </p>
                <button
                  onClick={() => {
                    resetComboForm();
                    setIsComboModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-900 text-white text-xs font-bold hover:bg-brand-950 shadow-sm"
                >
                  + Create First Combo Deal
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comboOffers.map((combo) => {
                  let itemsList: ComboItemDetail[] = [];
                  if (combo.combo_items) {
                    if (Array.isArray(combo.combo_items)) {
                      itemsList = combo.combo_items;
                    } else {
                      try {
                        itemsList = JSON.parse(combo.combo_items);
                      } catch {
                        itemsList = [];
                      }
                    }
                  }

                  const hasDiscount = Boolean(combo.original_price && combo.original_price > combo.price);
                  const discountPercent = hasDiscount
                    ? Math.round(((combo.original_price! - combo.price) / combo.original_price!) * 100)
                    : 0;

                  return (
                    <div
                      key={combo.id}
                      className="bg-white dark:bg-[#121815] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      <div>
                        {/* Header: Combo Badge & Category */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold flex items-center gap-1 border border-purple-200 dark:border-purple-800">
                            <Layers className="w-3 h-3 text-purple-600" />
                            Combo Package
                          </span>
                          {hasDiscount && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase">
                              Save {discountPercent}%
                            </span>
                          )}
                        </div>

                        {/* Title & Photo */}
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                            {combo.image_url ? (
                              <img
                                src={resolveImageUrl(combo.image_url)}
                                alt={combo.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400 font-serif text-[10px]">
                                Combo
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 truncate">
                              {combo.name}
                            </h4>
                            <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                              {combo.short_description || "Value combo bundle"}
                            </p>
                            <div className="flex items-baseline gap-2 mt-1">
                              {hasDiscount && (
                                <span className="text-xs text-stone-400 line-through">
                                  {formatPrice(combo.original_price!, currencySymbol)}
                                </span>
                              )}
                              <span className="font-serif text-base font-bold text-emerald-700 dark:text-emerald-400">
                                {formatPrice(combo.price, currencySymbol)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bundled Dishes List */}
                        {itemsList.length > 0 && (
                          <div className="mt-3.5 pt-3 border-t border-stone-100 dark:border-stone-800 space-y-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                              Included Dishes ({itemsList.reduce((acc, c) => acc + (c.quantity || 1), 0)} items)
                            </span>
                            <div className="space-y-1">
                              {itemsList.map((cItem) => (
                                <div
                                  key={cItem.id}
                                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800"
                                >
                                  <span className="font-medium text-stone-800 dark:text-stone-200 truncate">
                                    {cItem.quantity || 1}x {cItem.name}
                                  </span>
                                  <span className="text-stone-500 text-[11px] font-mono shrink-0">
                                    {formatPrice(cItem.price, currencySymbol)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
                        <span>Category: {combo.category_name || "Specials"}</span>
                        <span className="text-emerald-600 font-semibold">Active in Menu</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: ADD / EDIT DAILY WEEKDAY OFFER */}
        {isDailyOfferModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#121815] rounded-3xl border border-stone-200 dark:border-stone-800 max-w-lg w-full p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-900 dark:text-gold-400 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
                    Configure Weekday Daily Offer
                  </h3>
                </div>
                <button
                  onClick={() => setIsDailyOfferModalOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDailyOffer} className="space-y-4">
                {/* Select Dish */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Select Menu Item <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedDishId || ""}
                    onChange={(e) => setSelectedDishId(Number(e.target.value) || null)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-700"
                  >
                    <option value="">-- Choose a dish from menu --</option>
                    {allMenuItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({formatPrice(item.price, currencySymbol)}) - {item.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Days of Week Selectors */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                      Offer Days (When this offer appears) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setSelectedDays(selectedDays.length === 7 ? [] : [...DAYS_OF_WEEK])}
                      className="text-[11px] text-brand-900 dark:text-gold-400 font-semibold hover:underline"
                    >
                      {selectedDays.length === 7 ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const isSelected = selectedDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleToggleDay(day)}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                            isSelected
                              ? "bg-brand-950 text-gold-400 border-brand-950 shadow-xs font-bold"
                              : "bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-brand-700"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pricing Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Regular Price ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      placeholder="e.g. 5.000"
                      className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Offer Price ({currencySymbol}) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      placeholder="e.g. 3.500"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Savings Preview */}
                {parseFloat(originalPrice) > parseFloat(offerPrice) && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
                    <span>Discount Savings:</span>
                    <span>
                      {Math.round(
                        ((parseFloat(originalPrice) - parseFloat(offerPrice)) / parseFloat(originalPrice)) * 100
                      )}
                      % OFF (Save{" "}
                      {formatPrice(parseFloat(originalPrice) - parseFloat(offerPrice), currencySymbol)})
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDailyOfferModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveDailyOfferMutation.isPending}
                    className="px-5 py-2 rounded-xl bg-brand-900 hover:bg-brand-950 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {saveDailyOfferMutation.isPending ? "Saving..." : "Save Daily Offer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: CREATE COMBO DEAL WITH MULTI-DISH BUNDLER */}
        {isComboModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#121815] rounded-3xl border border-stone-200 dark:border-stone-800 max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 flex items-center justify-center">
                    <PackagePlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
                      Create New Combo Package Deal
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Select dishes from your current items to bundle into this combo.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsComboModalOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCombo} className="space-y-4">
                {/* Combo Title & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Combo Package Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={comboName}
                      onChange={(e) => setComboName(e.target.value)}
                      placeholder="e.g. Family Feast Combo"
                      className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Menu Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={comboCategoryId}
                      onChange={(e) => setComboCategoryId(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-700"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* DISH BUNDLE SELECTOR (PICK FROM CURRENT ITEMS) */}
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-950 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-600" />
                      Select Dishes from Current Items
                    </label>
                    <span className="text-[11px] font-semibold text-purple-800 dark:text-purple-300">
                      Total Regular Value: {formatPrice(bundledTotalValue, currencySymbol)}
                    </span>
                  </div>

                  {/* Add dish dropdown */}
                  <div className="flex items-center gap-2">
                    <select
                      value={pickerDishId}
                      onChange={(e) => setPickerDishId(e.target.value)}
                      className="flex-1 px-3.5 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="">-- Choose item to add to combo --</option>
                      {allMenuItems
                        .filter((item) => !item.is_combo)
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} - {formatPrice(item.price, currencySymbol)} ({item.category_name})
                          </option>
                        ))}
                    </select>

                    <button
                      type="button"
                      disabled={!pickerDishId}
                      onClick={() => handleAddDishToBundle(Number(pickerDishId))}
                      className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 shrink-0"
                    >
                      + Add Dish
                    </button>
                  </div>

                  {/* Bundled Items List */}
                  {bundledItems.length === 0 ? (
                    <p className="text-xs text-stone-400 italic text-center py-2">
                      No items bundled yet. Select a dish above to include it in this combo deal.
                    </p>
                  ) : (
                    <div className="space-y-2 pt-1 max-h-48 overflow-y-auto">
                      {bundledItems.map((bi) => (
                        <div
                          key={bi.id}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-purple-200/60 dark:border-purple-800/40"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {bi.image_url ? (
                              <img
                                src={resolveImageUrl(bi.image_url)}
                                alt={bi.name}
                                className="w-9 h-9 rounded-lg object-cover border border-stone-200 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 shrink-0 text-[10px]">
                                Item
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                                {bi.name}
                              </p>
                              <p className="text-[10px] text-stone-500 font-serif">
                                Unit: {formatPrice(bi.price, currencySymbol)}
                              </p>
                            </div>
                          </div>

                          {/* Quantity Stepper */}
                          <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-lg shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateBundleQty(bi.id, -1)}
                              className="w-5 h-5 rounded bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 flex items-center justify-center text-xs font-bold"
                            >
                              -
                            </button>
                            <span className="w-4 text-center text-xs font-bold text-stone-900 dark:text-stone-100">
                              {bi.quantity || 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateBundleQty(bi.id, 1)}
                              className="w-5 h-5 rounded bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 flex items-center justify-center text-xs font-bold"
                            >
                              +
                            </button>
                          </div>

                          <span className="text-xs font-serif font-bold text-stone-800 dark:text-stone-200 w-16 text-right shrink-0">
                            {formatPrice(bi.price * (bi.quantity || 1), currencySymbol)}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveBundleItem(bi.id)}
                            className="p-1 text-stone-400 hover:text-rose-600 transition-colors shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Combo Offer Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Total Regular Value
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formatPrice(bundledTotalValue, currencySymbol)}
                      className="w-full px-3.5 py-2.5 bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-serif font-bold text-stone-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Combo Offer Price ({currencySymbol}) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={comboPrice}
                      onChange={(e) => setComboPrice(e.target.value)}
                      placeholder="e.g. 10.000"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-serif font-bold text-emerald-800 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Live Savings Alert */}
                {bundledTotalValue > parseFloat(comboPrice) && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
                    <span>Customer Discount:</span>
                    <span>
                      Save {formatPrice(bundledTotalValue - parseFloat(comboPrice), currencySymbol)} (
                      {Math.round(((bundledTotalValue - parseFloat(comboPrice)) / bundledTotalValue) * 100)}% OFF)
                    </span>
                  </div>
                )}

                {/* Optional Days when Combo is Available */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Available Days (Optional - Leave empty for All Days)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS_OF_WEEK.map((day) => {
                      const isSelected = comboDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleToggleComboDay(day)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            isSelected
                              ? "bg-purple-900 text-white border-purple-900"
                              : "bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-purple-600"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Combo Short Description
                  </label>
                  <input
                    type="text"
                    value={comboDescription}
                    onChange={(e) => setComboDescription(e.target.value)}
                    placeholder="e.g. Delicious full meal for two including mains, drink and side"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-700"
                  />
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsComboModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createComboMutation.isPending}
                    className="px-5 py-2 rounded-xl bg-brand-900 hover:bg-brand-950 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {createComboMutation.isPending ? "Creating..." : "Create Combo Deal"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
