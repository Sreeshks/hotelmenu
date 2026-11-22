"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, Save, Image as ImageIcon, AlertCircle, Calendar, Clock } from "lucide-react";
import { Banner, BannerInput } from "@/types";
import { bannerService } from "@/services/banners";
import { categoryService } from "@/services/categories";
import { useToast } from "@/components/common/Toast";
import { ImageUpload } from "@/components/common/ImageUpload";

const PRESET_SECTIONS = [
  { value: "#menu-section", label: "🍽️ All Dishes / Main Menu (#menu-section)" },
  { value: "#offers-section", label: "⭐ Offers & Daily Deals Section (#offers-section)" },
  { value: "#bestsellers-section", label: "🏆 Chef's Bestsellers (#bestsellers-section)" },
  { value: "#popular-section", label: "🔥 Popular Dishes (#popular-section)" },
];

const DAYS_OF_WEEK = [
  { id: "Monday", label: "Mon", full: "Monday" },
  { id: "Tuesday", label: "Tue", full: "Tuesday" },
  { id: "Wednesday", label: "Wed", full: "Wednesday" },
  { id: "Thursday", label: "Thu", full: "Thursday" },
  { id: "Friday", label: "Fri", full: "Friday" },
  { id: "Saturday", label: "Sat", full: "Saturday" },
  { id: "Sunday", label: "Sun", full: "Sunday" },
];

const TIME_PRESETS = [
  { label: "🌅 Breakfast (06:00 - 11:30)", start: "06:00", end: "11:30" },
  { label: "🍛 Lunch (11:30 - 16:00)", start: "11:30", end: "16:00" },
  { label: "☕ Tea & Snacks (16:00 - 19:00)", start: "16:00", end: "19:00" },
  { label: "🌙 Dinner (19:00 - 23:59)", start: "19:00", end: "23:59" },
  { label: "🕒 All Day", start: "", end: "" },
];

const bannerSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(150),
  subtitle: z.string().max(200).optional().nullable(),
  description: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  button_text: z.string().max(50).optional().nullable(),
  button_link: z.string().max(255).optional().nullable(),
  display_order: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  schedule_days: z.string().optional().nullable(),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
});

type BannerFormData = z.infer<typeof bannerSchema>;

interface BannerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  banner?: Banner | null;
}

export function BannerFormModal({ isOpen, onClose, banner }: BannerFormModalProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCustomLink, setIsCustomLink] = useState<boolean>(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const isEdit = !!banner;

  // Fetch menu categories to populate target dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => categoryService.getCategories(),
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema) as any,
    defaultValues: {
      title: "",
      subtitle: "",
      description: "",
      image_url: "",
      button_text: "Order Biriyani",
      button_link: "#menu-section",
      display_order: 0,
      is_active: true,
      start_date: "",
      end_date: "",
      schedule_days: "",
      start_time: "",
      end_time: "",
    },
  });

  useEffect(() => {
    if (banner) {
      const link = banner.button_link || "";
      const isKnown =
        !link ||
        PRESET_SECTIONS.some((s) => s.value === link) ||
        link.startsWith("#category-");
      setIsCustomLink(!isKnown && link !== "");

      const initialDays = banner.schedule_days
        ? banner.schedule_days
            .split(",")
            .map((d) => d.trim())
            .filter((d) => d && d.toLowerCase() !== "all" && d.toLowerCase() !== "everyday")
        : [];
      setSelectedDays(initialDays);

      reset({
        title: banner.title,
        subtitle: banner.subtitle || "",
        description: banner.description || "",
        image_url: banner.image_url || "",
        button_text: banner.button_text || "",
        button_link: banner.button_link || "#menu-section",
        display_order: banner.display_order,
        is_active: banner.is_active,
        start_date: banner.start_date ? banner.start_date.split("T")[0] : "",
        end_date: banner.end_date ? banner.end_date.split("T")[0] : "",
        schedule_days: banner.schedule_days || "",
        start_time: banner.start_time || "",
        end_time: banner.end_time || "",
      });
      setSelectedImageFile(null);
      setImageRemoved(false);
    } else {
      setIsCustomLink(false);
      setSelectedDays([]);
      reset({
        title: "",
        subtitle: "",
        description: "",
        image_url: "",
        button_text: "Order Biriyani",
        button_link: "#menu-section",
        display_order: 0,
        is_active: true,
        start_date: "",
        end_date: "",
        schedule_days: "",
        start_time: "",
        end_time: "",
      });
      setSelectedImageFile(null);
      setImageRemoved(false);
    }
  }, [banner, reset, isOpen]);

  const currentButtonLink = watch("button_link") || "";

  const toggleDay = (dayId: string) => {
    let next: string[];
    if (selectedDays.includes(dayId)) {
      next = selectedDays.filter((d) => d !== dayId);
    } else {
      next = [...selectedDays, dayId];
    }
    setSelectedDays(next);
    setValue("schedule_days", next.length === 0 || next.length === 7 ? "" : next.join(","), {
      shouldDirty: true,
    });
  };

  const handleSelectAllDays = () => {
    setSelectedDays([]);
    setValue("schedule_days", "", { shouldDirty: true });
  };

  const applyTimePreset = (start: string, end: string) => {
    setValue("start_time", start, { shouldDirty: true });
    setValue("end_time", end, { shouldDirty: true });
  };

  const handleTargetChange = (val: string) => {
    if (val === "custom") {
      setIsCustomLink(true);
      return;
    }

    setIsCustomLink(false);
    setValue("button_link", val, { shouldDirty: true, shouldValidate: true });

    // Suggest appropriate button text if currently empty or standard default
    const currentBtn = watch("button_text")?.trim();
    if (!currentBtn || currentBtn === "Explore Menu" || currentBtn === "Order Biriyani") {
      if (val === "#offers-section") {
        setValue("button_text", "View Offers", { shouldDirty: true });
      } else if (val === "#menu-section") {
        setValue("button_text", "Explore Menu", { shouldDirty: true });
      } else if (val === "#bestsellers-section") {
        setValue("button_text", "View Bestsellers", { shouldDirty: true });
      } else if (val === "#popular-section") {
        setValue("button_text", "View Popular", { shouldDirty: true });
      } else if (val.startsWith("#category-")) {
        const catId = parseInt(val.replace("#category-", ""), 10);
        const cat = categories.find((c) => c.id === catId);
        if (cat) {
          setValue("button_text", `Explore ${cat.name}`, { shouldDirty: true });
        }
      }
    }
  };

  if (!isOpen) return null;

  const onSubmit = async (values: BannerFormData) => {
    if (!isEdit && !selectedImageFile && !values.image_url) {
      addToast({
        type: "error",
        title: "Image Required",
        message: "Please upload an image or provide an image URL for the banner.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: BannerInput = {
        title: values.title,
        subtitle: values.subtitle || undefined,
        description: values.description || undefined,
        image_url: values.image_url || "/uploads/placeholder_banner.jpg",
        button_text: values.button_text || undefined,
        button_link: values.button_link || undefined,
        display_order: Number(values.display_order),
        is_active: values.is_active,
        start_date: values.start_date ? new Date(values.start_date).toISOString() : undefined,
        end_date: values.end_date ? new Date(values.end_date).toISOString() : undefined,
        schedule_days: values.schedule_days || undefined,
        start_time: values.start_time || undefined,
        end_time: values.end_time || undefined,
      };

      let bannerId: number;

      if (isEdit && banner) {
        const updated = await bannerService.updateBanner(banner.id, payload);
        bannerId = updated.id;
        addToast({
          type: "success",
          title: "Banner Updated",
          message: `Banner "${updated.title}" updated successfully.`,
        });
      } else {
        const created = await bannerService.createBanner(payload);
        bannerId = created.id;
        addToast({
          type: "success",
          title: "Banner Created",
          message: `Banner "${created.title}" created successfully.`,
        });
      }

      if (selectedImageFile) {
        try {
          await bannerService.uploadImage(bannerId, selectedImageFile);
        } catch (uploadErr) {
          addToast({
            type: "warning",
            title: "Image Upload",
            message: "Banner saved, but image upload encountered an error.",
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["banners"] });
      onClose();
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "An unexpected error occurred while saving the banner.";
      addToast({
        type: "error",
        title: "Action Failed",
        message: typeof message === "string" ? message : JSON.stringify(message),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-brand-950/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-950">
                {isEdit ? "Edit Promotional Banner" : "New Promotional Banner"}
              </h3>
              <p className="text-xs text-stone-500">
                Showcase chef specials, seasonal pairings, and events.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-6 space-y-4 flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 tracking-wide uppercase mb-1.5">
              Banner Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register("title")}
              placeholder="e.g. Summer Truffle Degustation"
              className="w-full px-4 py-2.5 bg-stone-50/70 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white text-stone-900"
            />
            {errors.title && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 tracking-wide uppercase mb-1.5">
              Subtitle
            </label>
            <input
              type="text"
              {...register("subtitle")}
              placeholder="e.g. Handcrafted 5-course evening tasting menu"
              className="w-full px-4 py-2.5 bg-stone-50/70 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white text-stone-900"
            />
          </div>

          {/* Image Upload */}
          <div>
            <ImageUpload
              value={imageRemoved ? null : banner?.image_url}
              onChange={(file) => {
                setSelectedImageFile(file);
                if (file) setImageRemoved(false);
              }}
              onRemove={() => {
                setSelectedImageFile(null);
                setImageRemoved(true);
              }}
              label="Banner Image / Photography"
            />
          </div>

          {/* Button Text & CTA Target Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 tracking-wide uppercase mb-1.5">
                Call to Action Text
              </label>
              <input
                type="text"
                {...register("button_text")}
                placeholder="e.g. Order Biriyani, Explore Menu"
                className="w-full px-4 py-2 bg-stone-50/70 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white text-stone-900"
              />
              <p className="text-[10px] text-stone-400 mt-1">Label shown on the hero banner button</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 tracking-wide uppercase mb-1.5 flex items-center justify-between">
                <span>CTA Target Session / Link</span>
                <span className="text-[9px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Direct Section Route
                </span>
              </label>

              <select
                value={isCustomLink ? "custom" : (currentButtonLink || "#menu-section")}
                onChange={(e) => handleTargetChange(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50/70 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white text-stone-900 cursor-pointer"
              >
                <optgroup label="⚡ Main Sections">
                  <option value="#menu-section">🍽️ All Dishes / Main Menu (#menu-section)</option>
                  <option value="#offers-section">⭐ Offers & Daily Deals Section (#offers-section)</option>
                  <option value="#bestsellers-section">🏆 Chef&apos;s Bestsellers (#bestsellers-section)</option>
                  <option value="#popular-section">🔥 Popular Dishes (#popular-section)</option>
                </optgroup>

                {categories.length > 0 && (
                  <optgroup label="📁 Menu Categories">
                    {categories.map((cat) => (
                      <option key={cat.id} value={`#category-${cat.id}`}>
                        📁 Category: {cat.name} {cat.item_count ? `(${cat.item_count} items)` : ""}
                      </option>
                    ))}
                  </optgroup>
                )}

                <optgroup label="⚙️ Custom Route">
                  <option value="custom">🔗 Custom Link / Manual URL...</option>
                </optgroup>
              </select>

              {/* Custom manual link input if custom is selected */}
              {isCustomLink ? (
                <div className="mt-2 space-y-1">
                  <input
                    type="text"
                    {...register("button_link")}
                    placeholder="e.g. #category-3, /menu, or https://..."
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-700 text-stone-900"
                  />
                  <p className="text-[10px] text-stone-500">
                    Enter section anchor (#offers-section, #menu-section) or URL.
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Target: <span className="font-mono bg-stone-100 px-1 py-0.5 rounded text-[10px]">{currentButtonLink || "#menu-section"}</span>
                </p>
              )}
            </div>
          </div>

          {/* Day & Time Scheduling Section */}
          <div className="p-4 bg-stone-50/90 rounded-2xl border border-stone-200/90 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-brand-950 uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gold-600" />
                  <span>Day & Time Schedule</span>
                </h4>
                <p className="text-[11px] text-stone-500">
                  Control which days of the week and hours this banner appears (e.g. Breakfast on Monday).
                </p>
              </div>
            </div>

            {/* Active Days of Week */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
                  Active Days of Week
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAllDays()}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                      selectedDays.length === 0 || selectedDays.length === 7
                        ? "bg-brand-900 text-gold-300 shadow-2xs"
                        : "bg-stone-200 text-stone-700 hover:bg-stone-300"
                    }`}
                  >
                    All Days (Everyday)
                  </button>
                  {selectedDays.length > 0 && selectedDays.length < 7 && (
                    <button
                      type="button"
                      onClick={() => handleSelectAllDays()}
                      className="text-[10px] text-rose-600 hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Day Selection Pills */}
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = selectedDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-brand-900 text-gold-300 shadow-sm ring-1 ring-gold-400"
                          : "bg-white text-stone-600 border border-stone-200 hover:border-gold-400/60"
                      }`}
                      title={day.full}
                    >
                      <span className="block text-[11px]">{day.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-stone-500 mt-1.5 font-medium">
                {selectedDays.length === 0 || selectedDays.length === 7 ? (
                  <span className="text-emerald-700 font-semibold">✓ Active everyday of the week</span>
                ) : (
                  <span className="text-brand-900 font-semibold">✓ Active only on: {selectedDays.join(", ")}</span>
                )}
              </p>
            </div>

            {/* Time Window (Start & End Time) */}
            <div className="pt-3 border-t border-stone-200/70">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-stone-500" />
                  <span>Daily Active Hours</span>
                </label>
                <span className="text-[10px] text-stone-500 font-mono">24-hour format</span>
              </div>

              {/* Quick Time Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                {TIME_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyTimePreset(preset.start, preset.end)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white border border-stone-200 hover:border-gold-400 hover:bg-gold-50/50 text-stone-700 whitespace-nowrap transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-1">
                <div>
                  <label className="block text-[10px] font-medium text-stone-500 mb-1">
                    Start Time (Show from)
                  </label>
                  <input
                    type="time"
                    {...register("start_time")}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-700 text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-stone-500 mb-1">
                    End Time (Show until)
                  </label>
                  <input
                    type="time"
                    {...register("end_time")}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-700 text-stone-900"
                  />
                </div>
              </div>
              <p className="text-[10px] text-stone-500 mt-1.5">
                Leave times empty to display the banner all day without hour limits.
              </p>
            </div>
          </div>

          {/* Date Range & Order */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 tracking-wide uppercase mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                {...register("start_date")}
                className="w-full px-3 py-2 bg-stone-50/70 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white text-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 tracking-wide uppercase mb-1.5">
                End Date
              </label>
              <input
                type="date"
                {...register("end_date")}
                className="w-full px-3 py-2 bg-stone-50/70 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white text-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 tracking-wide uppercase mb-1.5">
                Display Order
              </label>
              <input
                type="number"
                {...register("display_order")}
                placeholder="0"
                className="w-full px-3 py-2 bg-stone-50/70 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white text-stone-900"
              />
            </div>
          </div>

          {/* Active status */}
          <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200">
            <div>
              <p className="text-sm font-semibold text-brand-950">Active Banner</p>
              <p className="text-xs text-stone-500">Enable display in customer menu hero carousel</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" {...register("is_active")} className="sr-only peer" />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-stone-600 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand-900 hover:bg-brand-950 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-gold-400" />
                  {isEdit ? "Update Banner" : "Create Banner"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
