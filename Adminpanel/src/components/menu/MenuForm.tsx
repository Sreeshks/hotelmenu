"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Save, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";
import { MenuItem, MenuItemInput } from "@/types";
import { menuService } from "@/services/menu";
import { categoryService } from "@/services/categories";
import { useToast } from "@/components/common/Toast";
import { MultiImageManager } from "@/components/menu/MultiImageManager";
import { GoogleImageSearchModal } from "@/components/menu/GoogleImageSearchModal";

const menuItemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  category_id: z.coerce.number().min(1, "Please select a category"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
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

export function MenuForm({ initialData, isEdit = false }: MenuFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
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

  // Fetch categories for dropdown
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getCategories(),
  });

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
      category_id: initialData?.category_id || (categories[0]?.id ?? 0),
      price: initialData?.price ? Number(initialData.price) : (0 as any),
      short_description: initialData?.short_description || "",
      description: initialData?.description || "",
      preparation_time: initialData?.preparation_time || "",
      tags: initialData?.tags || "",
      display_order: initialData?.display_order ?? 0,
      is_available: initialData?.is_available ?? true,
      is_featured: initialData?.is_featured ?? false,
      is_popular: initialData?.is_popular ?? false,
      is_bestseller: initialData?.is_bestseller ?? false,
    },
  });

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

  const onSubmit = async (values: MenuItemFormData) => {
    setIsSubmitting(true);
    try {
      const inputPayload: MenuItemInput = {
        name: values.name,
        category_id: Number(values.category_id),
        price: Number(values.price),
        short_description: values.short_description || undefined,
        description: values.description || undefined,
        preparation_time: values.preparation_time || undefined,
        tags: values.tags || undefined,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <Link
            href="/menu"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-brand-900 transition-colors uppercase tracking-wider mb-2"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Main Details */}
        <div className="lg:col-span-2 space-y-6">
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

            {/* Category & Price */}
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

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 tracking-wide uppercase mb-1.5">
                  Price ($) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 dark:text-stone-400 text-sm font-semibold">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("price")}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 bg-stone-50/60 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-stone-850 text-stone-900 dark:text-stone-100"
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
        </div>

        {/* Right 1 Column: Image & Badges/Flags */}
        <div className="space-y-6">
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
