"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  ArrowLeft,
  Save,
  Sparkles,
  AlertCircle,
  Layers,
  Plus,
  Trash2,
  Tag,
  Percent,
  Gift,
  Check,
  Utensils,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { MenuItem, MenuItemInput, ComboItemDetail } from "@/types";
import { menuService } from "@/services/menu";
import { categoryService } from "@/services/categories";
import { useToast } from "@/components/common/Toast";
import { MultiImageManager } from "@/components/menu/MultiImageManager";
import { GoogleImageSearchModal } from "@/components/menu/GoogleImageSearchModal";
import { useSettings } from "@/components/providers/SettingsProvider";
import { resolveImageUrl } from "@/lib/utils";

const menuItemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  category_id: z.coerce.number().min(1, "Please select a category"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  original_price: z.coerce.number().optional().nullable(),
  is_combo: z.boolean().default(false),
  short_description: z.string().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
  preparation_time: z.string().max(50).optional().nullable(),
  tags: z.string().max(255).optional().nullable(),
  display_order: z.coerce.number().default(0),
  is_available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_popular: z.boolean().default(false),
  is_bestseller: z.boolean().default(false),
});

type MenuItemFormData = z.infer<typeof menuItemSchema>;

interface MenuFormProps {
  initialData?: MenuItem;
  isEdit?: boolean;
  defaultCategoryId?: number;
  defaultIsCombo?: boolean;
}

const COMMON_TAGS = [
  "Chef's Special",
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Spicy",
  "Signature Dish",
  "Beverage",
  "Organic",
];

export function MenuForm({
  initialData,
  isEdit = false,
  defaultCategoryId,
  defaultIsCombo = false,
}: MenuFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const { currencySymbol } = useSettings();
  const cleanCurrency = (currencySymbol || "OMR ").trim();
  const plClass = cleanCurrency.length > 3 ? "pl-20" : cleanCurrency.length > 1 ? "pl-16" : "pl-9";
  const queryClient = useQueryClient();
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [itemImages, setItemImages] = useState<string[]>(() => {
    if (initialData?.images && Array.isArray(initialData.images) && initialData.images.length > 0) {
      return initialData.images;
    }
    if (initialData?.image_url) {
      return [initialData.image_url];
    }
    return [];
  });
  const [isGlobalGoogleModalOpen, setIsGlobalGoogleModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Combo states
  const [isCombo, setIsCombo] = useState<boolean>(() => {
    return initialData?.is_combo ?? defaultIsCombo ?? false;
  });

  const [comboItems, setComboItems] = useState<ComboItemDetail[]>(() => {
    if (!initialData?.combo_items) return [];
    if (Array.isArray(initialData.combo_items)) return initialData.combo_items;
    try {
      const parsed = JSON.parse(initialData.combo_items);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [originalPriceValue, setOriginalPriceValue] = useState<string>(() => {
    if (initialData?.original_price !== undefined && initialData?.original_price !== null) {
      return String(initialData.original_price);
    }
    return "";
  });

  const [selectedDishId, setSelectedDishId] = useState<string>("");

  // Fetch categories for dropdown
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getCategories(),
  });

  // Fetch selectable items for combo builder
  const { data: allMenuItemsData, isLoading: isLoadingAllItems } = useQuery({
    queryKey: ["all-menu-items-combo-picker"],
    queryFn: () => menuService.getMenuItems({ limit: 200, is_active: true }),
    enabled: isCombo,
  });

  const selectableItems = (allMenuItemsData?.data || []).filter(
    (item) => !initialData?.id || item.id !== initialData.id
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      category_id: initialData?.category_id || defaultCategoryId || (categories[0]?.id ?? 0),
      price: initialData?.price ? Number(initialData.price) : (0 as any),
      original_price: initialData?.original_price ? Number(initialData.original_price) : null,
      is_combo: initialData?.is_combo ?? defaultIsCombo ?? false,
      short_description: initialData?.short_description || "",
      description: initialData?.description || "",
      preparation_time: initialData?.preparation_time || "",
      tags: initialData?.tags || (defaultIsCombo ? "Combo" : ""),
      display_order: initialData?.display_order ?? 0,
      is_available: initialData?.is_available ?? true,
      is_featured: initialData?.is_featured ?? false,
      is_popular: initialData?.is_popular ?? false,
      is_bestseller: initialData?.is_bestseller ?? false,
    },
  });

  // Keep form category synced if defaultCategoryId arrives late
  React.useEffect(() => {
    if (defaultCategoryId && !initialData?.category_id) {
      setValue("category_id", defaultCategoryId);
    }
  }, [defaultCategoryId, initialData, setValue]);

  const currentPrice = watch("price");
  const currentTags = watch("tags") || "";

  const handleTagToggle = (tag: string) => {
    const tagsArray = currentTags
      ? currentTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    if (tagsArray.includes(tag)) {
      const updated = tagsArray.filter((t) => t !== tag).join(", ");
      setValue("tags", updated);
    } else {
      const updated = [...tagsArray, tag].join(", ");
      setValue("tags", updated);
    }
  };

  const handleAddDishToCombo = (dishId: number) => {
    const dish = selectableItems.find((d) => d.id === dishId);
    if (!dish) return;

    setComboItems((prev) => {
      const existing = prev.find((item) => item.id === dish.id);
      let nextList: ComboItemDetail[];
      if (existing) {
        nextList = prev.map((item) =>
          item.id === dish.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
        );
      } else {
        nextList = [
          ...prev,
          {
            id: dish.id,
            name: dish.name,
            price: Number(dish.price),
            quantity: 1,
            image_url: dish.image_url || (dish.images && dish.images[0]) || null,
          },
        ];
      }

      const totalRegular = nextList.reduce(
        (acc, curr) => acc + curr.price * (curr.quantity || 1),
        0
      );
      const roundedTotal = parseFloat(totalRegular.toFixed(3));
      setOriginalPriceValue(String(roundedTotal));
      setValue("original_price", roundedTotal);
      return nextList;
    });
    setSelectedDishId("");
  };

  const handleUpdateItemQuantity = (dishId: number, delta: number) => {
    setComboItems((prev) => {
      const nextList = prev
        .map((item) => {
          if (item.id === dishId) {
            const nextQty = (item.quantity || 1) + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as ComboItemDetail[];

      const totalRegular = nextList.reduce(
        (acc, curr) => acc + curr.price * (curr.quantity || 1),
        0
      );
      const roundedTotal = parseFloat(totalRegular.toFixed(3));
      setOriginalPriceValue(String(roundedTotal));
      setValue("original_price", roundedTotal);
      return nextList;
    });
  };

  const handleRemoveDishFromCombo = (dishId: number) => {
    setComboItems((prev) => {
      const nextList = prev.filter((item) => item.id !== dishId);
      const totalRegular = nextList.reduce(
        (acc, curr) => acc + curr.price * (curr.quantity || 1),
        0
      );
      const roundedTotal = parseFloat(totalRegular.toFixed(3));
      setOriginalPriceValue(nextList.length > 0 ? String(roundedTotal) : "");
      setValue("original_price", nextList.length > 0 ? roundedTotal : null);
      return nextList;
    });
  };

  const handleApplyDiscountPercentage = (percentage: number) => {
    const orig = parseFloat(originalPriceValue);
    if (!orig || orig <= 0) {
      addToast({
        type: "error",
        title: "Standard Price Required",
        message: "Add items to the combo first or set an original price.",
      });
      return;
    }
    const discounted = orig * (1 - percentage / 100);
    setValue("price", parseFloat(discounted.toFixed(3)));
    addToast({
      type: "success",
      title: `${percentage}% Discount Applied`,
      message: `Offer price calculated as ${cleanCurrency} ${discounted.toFixed(3)}`,
    });
  };

  const handleAutoGenerateDescription = () => {
    if (comboItems.length === 0) return;
    const itemsSummary = comboItems
      .map((i) => `${i.quantity || 1}x ${i.name}`)
      .join(", ");
    setValue("short_description", `Combo Meal Includes: ${itemsSummary}`);
    addToast({
      type: "info",
      title: "Description Updated",
      message: "Summary generated from included combo dishes.",
    });
  };

  const onSubmit = async (values: MenuItemFormData) => {
    setIsSubmitting(true);
    try {
      // Ensure "Combo" tag is attached if isCombo is true
      let finalTags = values.tags || "";
      if (isCombo) {
        const tagList = finalTags.split(",").map((t) => t.trim()).filter(Boolean);
        if (!tagList.some((t) => t.toLowerCase() === "combo")) {
          tagList.push("Combo");
          finalTags = tagList.join(", ");
        }
      }

      const inputPayload: MenuItemInput = {
        name: values.name,
        category_id: Number(values.category_id),
        price: Number(values.price),
        original_price: originalPriceValue ? parseFloat(originalPriceValue) : undefined,
        is_combo: isCombo,
        combo_items: isCombo && comboItems.length > 0 ? comboItems : undefined,
        short_description: values.short_description || undefined,
        description: values.description || undefined,
        preparation_time: values.preparation_time || undefined,
        tags: finalTags || undefined,
        display_order: Number(values.display_order),
        is_available: values.is_available,
        is_featured: values.is_featured,
        is_popular: values.is_popular,
        is_bestseller: values.is_bestseller,
        images: itemImages,
        image_url: itemImages[0] || undefined,
      };

      let itemId: number;

      if (isEdit && initialData) {
        const updated = await menuService.updateMenuItem(initialData.id, inputPayload);
        itemId = updated.id;
        addToast({
          type: "success",
          title: "Menu Item Updated",
          message: `"${values.name}" has been successfully saved.`,
        });
      } else {
        const created = await menuService.createMenuItem(inputPayload);
        itemId = created.id;
        addToast({
          type: "success",
          title: "Menu Item Created",
          message: `"${values.name}" has been added to the digital menu.`,
        });
      }

      // If a new image file was uploaded, upload it to the item
      if (selectedImageFile) {
        try {
          await menuService.uploadImage(itemId, selectedImageFile);
        } catch (uploadErr: any) {
          addToast({
            type: "warning",
            title: "Image Upload Notice",
            message: "Item details were saved, but image upload encountered an error.",
          });
        }
      }

      // Invalidate relevant query caches
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

      router.push("/menu");
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "An unexpected error occurred while saving the item.";
      addToast({
        type: "error",
        title: "Failed to Save",
        message: typeof message === "string" ? message : JSON.stringify(message),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-7xl mx-auto w-full px-1 sm:px-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800">
        <div>
          <Link
            href="/menu"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-brand-900 dark:hover:text-emerald-400 transition-colors uppercase tracking-wider mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Menu Items
          </Link>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-brand-950 dark:text-stone-100">
            {isEdit ? `Edit: ${initialData?.name}` : "Create New Menu Item"}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            {isEdit
              ? "Modify presentation, pricing, availability, and attributes."
              : "Add an exquisite culinary selection to your digital catalog."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/menu"
            className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-brand-900 hover:bg-brand-950 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-gold-400 dark:text-gold-300" />
                {isEdit ? "Save Changes" : "Create Item"}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Columns: Main Details */}
        <div className="xl:col-span-7 space-y-6">
          {/* General Information Card */}
          <div className="bg-white dark:bg-[#121815] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6 shadow-sm space-y-5">
            <h2 className="text-base font-semibold text-brand-950 dark:text-stone-100 pb-3 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-500" />
              General Information
            </h2>

            {/* Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 tracking-wide uppercase">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsGlobalGoogleModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-brand-950 dark:hover:text-white bg-stone-100 dark:bg-stone-800 hover:bg-stone-200/70 dark:hover:bg-stone-700 px-2.5 py-1 rounded-xl transition-all border border-stone-200/80 dark:border-stone-700 shadow-2xs group"
                  title="Search dish photography on Google"
                >
                  {/* Google G Logo SVG */}
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Google Image Search</span>
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  {...register("name")}
                  placeholder="e.g. Royal Truffle Risotto"
                  className="w-full pl-4 pr-11 py-2.5 bg-stone-50/60 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-stone-850 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
                />
                <button
                  type="button"
                  onClick={() => setIsGlobalGoogleModalOpen(true)}
                  className="absolute right-2.5 p-1 rounded-lg text-stone-400 hover:text-brand-900 dark:hover:text-emerald-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  title="Search related images on Google for this name"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                </button>
              </div>
              {errors.name && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Category & Pricing Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 tracking-wide uppercase mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register("category_id")}
                  disabled={isLoadingCategories}
                  className="w-full px-4 py-2.5 bg-stone-50/60 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-stone-850 text-stone-900 dark:text-stone-100"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.category_id.message}
                  </p>
                )}
              </div>

              {/* Price / Offer Price Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 tracking-wide uppercase">
                    {isCombo || originalPriceValue ? "Offer / Selling Price" : "Price"} ({cleanCurrency}) <span className="text-rose-500">*</span>
                  </label>
                  {isCombo && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      Combo Offer
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 dark:text-stone-400 text-sm font-semibold">
                    {cleanCurrency}
                  </span>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    {...register("price")}
                    placeholder="0.000"
                    className={`w-full ${plClass} pr-4 py-2.5 bg-stone-50/60 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-stone-850 text-stone-900 dark:text-stone-100 font-semibold`}
                  />
                </div>
                {errors.price && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.price.message}
                  </p>
                )}
              </div>
            </div>

            {/* Standard / Original Strike-through Price field */}
            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-stone-500" />
                    Standard / Original Price (Strikethrough)
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Shown crossed out next to the offer price on customer menu
                  </p>
                </div>
                {originalPriceValue && currentPrice && Number(originalPriceValue) > Number(currentPrice) && (
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg">
                    Save {cleanCurrency} {(Number(originalPriceValue) - Number(currentPrice)).toFixed(3)} ({Math.round(((Number(originalPriceValue) - Number(currentPrice)) / Number(originalPriceValue)) * 100)}% OFF)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-5 relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-medium">
                    {cleanCurrency}
                  </span>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={originalPriceValue}
                    onChange={(e) => {
                      setOriginalPriceValue(e.target.value);
                      setValue("original_price", e.target.value ? parseFloat(e.target.value) : null);
                    }}
                    placeholder={isCombo ? "Auto-calculated from items" : "e.g. 3.500"}
                    className={`w-full ${plClass} pr-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-700 dark:focus:ring-emerald-500 text-stone-800 dark:text-stone-200`}
                  />
                </div>

                {/* Quick discount buttons */}
                <div className="sm:col-span-7 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-stone-400 font-medium mr-1 flex items-center gap-1">
                    <Percent className="w-3 h-3" /> Quick Offer:
                  </span>
                  {[10, 15, 20, 25, 30].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleApplyDiscountPercentage(pct)}
                      className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-stone-800 hover:bg-gold-50 dark:hover:bg-gold-950/40 text-stone-700 dark:text-stone-300 hover:text-gold-700 border border-stone-200 dark:border-stone-700 transition-colors shadow-2xs"
                    >
                      {pct}% OFF
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preparation time & Display Order */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 tracking-wide uppercase mb-1.5">
                  Preparation Time
                </label>
                <input
                  type="text"
                  {...register("preparation_time")}
                  placeholder="e.g. 15-20 mins"
                  className="w-full px-4 py-2.5 bg-stone-50/60 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-stone-850 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 tracking-wide uppercase mb-1.5">
                  Display Order
                </label>
                <input
                  type="number"
                  {...register("display_order")}
                  placeholder="0"
                  className="w-full px-4 py-2.5 bg-stone-50/60 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-stone-850 text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 tracking-wide uppercase mb-1.5">
                Short Description
              </label>
              <input
                type="text"
                {...register("short_description")}
                placeholder="One sentence summary for menu card highlights"
                className="w-full px-4 py-2.5 bg-stone-50/60 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-stone-850 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
              />
            </div>

            {/* Full Description */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 tracking-wide uppercase mb-1.5">
                Full Description & Culinary Story
              </label>
              <textarea
                rows={4}
                {...register("description")}
                placeholder="Detailed ingredient list, preparation methods, allergen details, and flavor notes..."
                className="w-full px-4 py-2.5 bg-stone-50/60 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-stone-850 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 resize-y"
              />
            </div>

            {/* Tags & Quick Select */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 tracking-wide uppercase mb-1.5">
                Dietary & Culinary Tags (Comma separated)
              </label>
              <input
                type="text"
                {...register("tags")}
                placeholder="Spicy, Gluten-Free, Chef's Special"
                className="w-full px-4 py-2.5 bg-stone-50/60 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-stone-850 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 mb-2"
              />
              <div className="flex flex-wrap gap-1.5">
                {COMMON_TAGS.map((tag) => {
                  const isSelected = currentTags
                    .split(",")
                    .map((t) => t.trim().toLowerCase())
                    .includes(tag.toLowerCase());
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        isSelected
                          ? "bg-gold-50 dark:bg-gold-950/60 border-gold-400 dark:border-gold-800 text-gold-900 dark:text-gold-300 font-semibold"
                          : "bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-600"
                      }`}
                    >
                      {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Combo Deal / Bundle Multiple Dishes Card */}
          <div className="bg-white dark:bg-[#121815] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shadow-2xs">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-brand-950 dark:text-stone-100 flex items-center gap-2">
                    Combo Package & Dish Bundling
                    {isCombo && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-600 text-white">
                        Active
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Bundle multiple menu items together into an attractive combo with an offer price
                  </p>
                </div>
              </div>

              {/* Combo Master Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCombo}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsCombo(checked);
                    if (checked && !currentTags.toLowerCase().includes("combo")) {
                      const updated = currentTags ? `${currentTags}, Combo` : "Combo";
                      setValue("tags", updated);
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 dark:bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {isCombo ? (
              <div className="space-y-4">
                {/* Item Selector Dropdown */}
                <div className="bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-100 dark:border-purple-900/40 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                    Select Dishes to Include in this Combo
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedDishId}
                      onChange={(e) => setSelectedDishId(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-white dark:bg-stone-850 border border-purple-200 dark:border-purple-800 rounded-xl text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="">-- Choose a dish from menu ({selectableItems.length} available) --</option>
                      {selectableItems.map((dish) => (
                        <option key={dish.id} value={dish.id}>
                          {dish.name} &bull; {cleanCurrency} {Number(dish.price).toFixed(3)} ({dish.category_name || "Specialty"})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={!selectedDishId}
                      onClick={() => {
                        if (selectedDishId) {
                          handleAddDishToCombo(Number(selectedDishId));
                        }
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Add to Combo
                    </button>
                  </div>
                </div>

                {/* Included Items List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-500 font-semibold uppercase tracking-wider px-1">
                    <span>Included Items ({comboItems.reduce((acc, c) => acc + (c.quantity || 1), 0)} Total Dishes)</span>
                    {comboItems.length > 0 && (
                      <button
                        type="button"
                        onClick={handleAutoGenerateDescription}
                        className="text-purple-600 dark:text-purple-400 hover:underline normal-case font-medium flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        Auto-generate Description from items
                      </button>
                    )}
                  </div>

                  {comboItems.length === 0 ? (
                    <div className="p-6 text-center rounded-xl border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 text-stone-400">
                      <Utensils className="w-7 h-7 mx-auto mb-1.5 opacity-60 text-purple-400" />
                      <p className="text-xs font-medium text-stone-600 dark:text-stone-300">
                        No dishes added yet
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Choose dishes from the dropdown above to bundle them into this combo package.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {comboItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-800 hover:border-purple-300 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {item.image_url ? (
                              <img
                                src={resolveImageUrl(item.image_url)}
                                alt={item.name}
                                className="w-10 h-10 rounded-lg object-cover border border-stone-200 dark:border-stone-700 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-400 shrink-0">
                                <Utensils className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                                {cleanCurrency} {Number(item.price).toFixed(3)} each
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3">
                            {/* Quantity Stepper */}
                            <div className="flex items-center rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-0.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQuantity(item.id, -1)}
                                className="w-6 h-6 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-xs font-bold"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-xs font-bold text-stone-900 dark:text-white">
                                {item.quantity || 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQuantity(item.id, 1)}
                                className="w-6 h-6 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-xs font-bold"
                              >
                                +
                              </button>
                            </div>

                            {/* Subtotal */}
                            <span className="text-xs font-bold text-brand-950 dark:text-stone-100 min-w-[55px] text-right">
                              {cleanCurrency} {(Number(item.price) * (item.quantity || 1)).toFixed(3)}
                            </span>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveDishFromCombo(item.id)}
                              className="p-1 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Combo Totals Summary Bar */}
                      <div className="mt-3 p-3.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="text-stone-500 dark:text-stone-400 block text-[11px]">
                            Sum of individual dishes:
                          </span>
                          <span className="font-bold text-stone-900 dark:text-stone-100 line-through text-sm">
                            {cleanCurrency} {Number(originalPriceValue || 0).toFixed(3)}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-purple-700 dark:text-purple-300 block text-[11px] font-bold uppercase tracking-wider">
                              Current Combo Offer:
                            </span>
                            <span className="font-serif font-bold text-base text-purple-900 dark:text-purple-200">
                              {cleanCurrency} {Number(currentPrice || 0).toFixed(3)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400 flex items-center justify-between">
                <span>Enable this toggle to bundle multiple dishes into this item and showcase an offer price.</span>
                <button
                  type="button"
                  onClick={() => setIsCombo(true)}
                  className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors"
                >
                  Enable Combo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Image & Badges/Flags */}
        <div className="xl:col-span-5 space-y-6">
          {/* Image Upload Card (Up to 3 images with Google Image Search) */}
          <div className="bg-white dark:bg-[#121815] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6 shadow-sm">
            <MultiImageManager
              images={itemImages}
              onChange={setItemImages}
              productName={watch("name") || ""}
              onFileUpload={(file) => setSelectedImageFile(file)}
              maxImages={3}
            />
          </div>

          {/* Visibility & Badges Card */}
          <div className="bg-white dark:bg-[#121815] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-brand-950 dark:text-stone-100 pb-2 border-b border-stone-100 dark:border-stone-800">
              Availability & Badges
            </h2>

            {/* In Stock / Available Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800">
              <div>
                <p className="text-sm font-semibold text-brand-950 dark:text-stone-100">In Stock / Available</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Customers can view and order</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register("is_available")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 dark:bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Featured Badge */}
            <div className="flex items-center justify-between p-3.5 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800">
              <div>
                <p className="text-sm font-semibold text-brand-950 dark:text-stone-100">Featured Item</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Highlighted on top carousels</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register("is_featured")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 dark:bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
              </label>
            </div>

            {/* Popular Badge */}
            <div className="flex items-center justify-between p-3.5 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800">
              <div>
                <p className="text-sm font-semibold text-brand-950 dark:text-stone-100">Popular Choice</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Shows &quot;Popular&quot; flame badge</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register("is_popular")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 dark:bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-700"></div>
              </label>
            </div>

            {/* Bestseller Badge */}
            <div className="flex items-center justify-between p-3.5 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800">
              <div>
                <p className="text-sm font-semibold text-brand-950 dark:text-stone-100">Bestseller</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Shows &quot;Bestseller&quot; luxury badge</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register("is_bestseller")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 dark:bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Global Google Search Modal triggered from Item Name */}
      <GoogleImageSearchModal
        isOpen={isGlobalGoogleModalOpen}
        onClose={() => setIsGlobalGoogleModalOpen(false)}
        defaultQuery={watch("name") || ""}
        onSelectImages={(newUrls) => {
          const combined = [...itemImages];
          for (const u of newUrls) {
            if (!combined.includes(u) && combined.length < 3) {
              combined.push(u);
            }
          }
          setItemImages(combined.slice(0, 3));
        }}
        maxSelectable={Math.max(1, 3 - itemImages.length)}
      />
    </form>
  );
}
