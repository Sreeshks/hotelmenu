"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  X,
  Loader2,
  Save,
  FolderPlus,
  Edit3,
  AlertCircle,
  UploadCloud,
  Trash2,
  ExternalLink,
  Link2,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import { Category, CategoryInput } from "@/types";
import { categoryService } from "@/services/categories";
import { uploadService } from "@/services/upload";
import { useToast } from "@/components/common/Toast";
import { GoogleImageSearchModal } from "@/components/menu/GoogleImageSearchModal";
import { resolveImageUrl } from "@/lib/utils";

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z.string().max(100).optional().nullable(),
  description: z.string().max(255).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  display_order: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
}

export function CategoryFormModal({ isOpen, onClose, category }: CategoryFormModalProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState<boolean>(false);
  const [isUploadingImgbb, setIsUploadingImgbb] = useState<boolean>(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState<boolean>(false);
  const [isDirectUrlOpen, setIsDirectUrlOpen] = useState<boolean>(false);
  const [directUrlValue, setDirectUrlValue] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isEdit = !!category;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      icon: "",
      display_order: 0,
      is_active: true,
    },
  });

  const categoryName = watch("name");

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        icon: category.icon || "",
        display_order: category.display_order,
        is_active: category.is_active,
      });
      setImageUrl(category.image || null);
      setImageRemoved(false);
      setDirectUrlValue("");
      setIsDirectUrlOpen(false);
    } else {
      reset({
        name: "",
        slug: "",
        description: "",
        icon: "",
        display_order: 0,
        is_active: true,
      });
      setImageUrl(null);
      setImageRemoved(false);
      setDirectUrlValue("");
      setIsDirectUrlOpen(false);
    }
  }, [category, reset, isOpen]);

  if (!isOpen) return null;

  // Handle local file selection -> ImgBB upload
  const handleFileSelected = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      addToast({
        type: "error",
        title: "Invalid File",
        message: "Please select an image file (JPG, PNG, WEBP).",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast({
        type: "error",
        title: "File Too Large",
        message: "Image must be under 5MB.",
      });
      return;
    }

    setIsUploadingImgbb(true);
    try {
      const uploadedUrl = await uploadService.uploadImage(file, "categories");
      if (uploadedUrl) {
        setImageUrl(uploadedUrl);
        setImageRemoved(false);
        addToast({
          type: "success",
          title: "Uploaded to ImgBB",
          message: "Image uploaded and CDN URL generated.",
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Failed to upload image to ImgBB.";
      addToast({
        type: "error",
        title: "Upload Failed",
        message: typeof msg === "string" ? msg : JSON.stringify(msg),
      });
    } finally {
      setIsUploadingImgbb(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  // Google Image Selection
  const handleSelectFromGoogle = (urls: string[]) => {
    if (urls && urls[0]) {
      setImageUrl(urls[0]);
      setImageRemoved(false);
      addToast({
        type: "success",
        title: "Image Selected",
        message: "Image selected from Google Search.",
      });
    }
    setIsGoogleModalOpen(false);
  };

  // Direct URL paste
  const handleApplyDirectUrl = () => {
    const trimmed = directUrlValue.trim();
    if (!trimmed) return;
    setImageUrl(trimmed);
    setImageRemoved(false);
    setDirectUrlValue("");
    setIsDirectUrlOpen(false);
    addToast({
      type: "success",
      title: "URL Applied",
      message: "Image URL updated successfully.",
    });
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setImageRemoved(true);
  };

  const onSubmit = async (values: CategoryFormData) => {
    setIsSubmitting(true);
    try {
      // In the DB only keep the URL
      const finalImageUrl = imageRemoved ? null : (imageUrl || null);

      const payload: CategoryInput = {
        name: values.name,
        slug: values.slug || undefined,
        description: values.description || undefined,
        image: finalImageUrl,
        display_order: Number(values.display_order),
        is_active: values.is_active,
      };

      if (isEdit && category) {
        const updated = await categoryService.updateCategory(category.id, payload);
        addToast({
          type: "success",
          title: "Category Updated",
          message: `Category "${updated.name}" updated successfully.`,
        });
      } else {
        const created = await categoryService.createCategory(payload);
        addToast({
          type: "success",
          title: "Category Created",
          message: `Category "${created.name}" created successfully.`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onClose();
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "An unexpected error occurred while saving category.";
      addToast({
        type: "error",
        title: "Action Failed",
        message: typeof message === "string" ? message : JSON.stringify(message),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasImage = !imageRemoved && !!imageUrl;
  const isImgbbUrl = hasImage && imageUrl.includes("ibb.co");

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal Dialog */}
        <div className="relative w-full max-w-lg bg-white dark:bg-[#121815] rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-900/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-emerald-950/50 flex items-center justify-center text-brand-800 dark:text-emerald-400 border border-brand-200/50 dark:border-emerald-800/40">
                {isEdit ? <Edit3 className="w-5 h-5" /> : <FolderPlus className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                  {isEdit ? "Edit Category" : "New Category"}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {isEdit
                    ? "Update category details and header image"
                    : "Create a culinary category for your menu"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-6 space-y-4 flex-1">
            {/* Category Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 tracking-wide uppercase mb-1.5">
                Category Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register("name")}
                placeholder="e.g. Hot Beverages, Desserts, Starters"
                className="w-full px-4 py-2.5 bg-stone-50/70 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-stone-850 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
              />
              {errors.name && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 tracking-wide uppercase mb-1.5">
                Description
              </label>
              <textarea
                rows={2}
                {...register("description")}
                placeholder="Brief description of dishes in this collection..."
                className="w-full px-4 py-2 bg-stone-50/70 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-stone-850 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 resize-none"
              />
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 tracking-wide uppercase mb-1.5">
                Display Order
              </label>
              <input
                type="number"
                {...register("display_order")}
                placeholder="0"
                className="w-full px-4 py-2 bg-stone-50/70 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-stone-850 text-stone-900 dark:text-stone-100"
              />
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                Lower numbers appear first on customer digital menu tabs.
              </p>
            </div>

            {/* Category Header Image Section (ImgBB + Google Image Search) */}
            <div className="space-y-2 pt-1">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileInputChange}
              />

              {/* Section Header */}
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 tracking-wide uppercase">
                  Category Header Image
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ImgBB Cloud
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsGoogleModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-brand-600 hover:bg-stone-50 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 shadow-sm transition-all group"
                    title="Search Google Images by category name"
                  >
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
                    <span className="font-semibold text-stone-700 dark:text-stone-300 group-hover:text-brand-900 dark:group-hover:text-emerald-400">
                      Google Search
                    </span>
                  </button>
                </div>
              </div>

              {/* Uploading state */}
              {isUploadingImgbb ? (
                <div className="rounded-2xl border border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20 p-6 flex flex-col items-center justify-center gap-2.5 text-center">
                  <Loader2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 animate-spin" />
                  <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                    Uploading image to ImgBB Cloud...
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Generating secure cloud CDN URL
                  </p>
                </div>
              ) : hasImage ? (
                /* Image Preview Card */
                <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-3 shadow-sm space-y-2.5">
                  <div className="relative w-full h-44 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveImageUrl(imageUrl)}
                      alt="Category header"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80";
                      }}
                    />

                    {/* Badge */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      {isImgbbUrl ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/85 text-emerald-300 backdrop-blur-sm border border-emerald-500/40 shadow-sm flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          ImgBB Cloud URL
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-950/85 text-stone-200 backdrop-blur-sm border border-stone-700/50 shadow-sm flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-gold-400" />
                          Web Image URL
                        </span>
                      )}
                    </div>

                    {/* External Link */}
                    <a
                      href={imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-stone-950/70 hover:bg-stone-950 text-white backdrop-blur-sm transition-colors"
                      title="Open image in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Actions under preview */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsGoogleModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition-colors"
                      >
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
                        <span>Change (Google)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition-colors"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Upload File (ImgBB)</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty State: Upload / Search Dual Control */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`rounded-2xl border-2 border-dashed transition-all p-5 text-center flex flex-col items-center justify-center gap-3.5 ${
                    isDragging
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 bg-stone-50/50 dark:bg-stone-900/40"
                  }`}
                >
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer flex flex-col items-center w-full"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-stone-800 shadow-sm border border-stone-200 dark:border-stone-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2 hover:scale-105 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                      <span className="text-emerald-600 dark:text-emerald-400 underline underline-offset-2">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      JPG, PNG, or WEBP (max 5MB) • Auto-uploaded to ImgBB Cloud
                    </p>
                  </div>

                  <div className="w-full flex items-center gap-3 my-0.5">
                    <div className="h-px bg-stone-200 dark:bg-stone-700 flex-1" />
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      OR
                    </span>
                    <div className="h-px bg-stone-200 dark:bg-stone-700 flex-1" />
                  </div>

                  {/* Google Image Search Action Button */}
                  <button
                    type="button"
                    onClick={() => setIsGoogleModalOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 shadow-sm flex items-center justify-center gap-2.5 transition-all group"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
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
                    <span className="text-xs font-semibold">
                      Search Google for &ldquo;{categoryName?.trim() || "Category"}&rdquo;
                    </span>
                  </button>

                  {/* Direct Paste URL Toggle */}
                  <div className="w-full text-left">
                    {!isDirectUrlOpen ? (
                      <button
                        type="button"
                        onClick={() => setIsDirectUrlOpen(true)}
                        className="text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 mx-auto"
                      >
                        <Link2 className="w-3 h-3" />
                        <span>Or paste image URL directly</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="url"
                          value={directUrlValue}
                          onChange={(e) => setDirectUrlValue(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="flex-1 px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-700"
                        />
                        <button
                          type="button"
                          onClick={handleApplyDirectUrl}
                          className="px-2.5 py-1.5 bg-brand-900 hover:bg-brand-950 text-white rounded-lg text-xs font-medium"
                        >
                          Apply
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsDirectUrlOpen(false);
                            setDirectUrlValue("");
                          }}
                          className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Active status */}
            <div className="flex items-center justify-between p-3.5 bg-stone-50 dark:bg-stone-900/70 rounded-xl border border-stone-200 dark:border-stone-800">
              <div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Active Status
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Visible to guests in customer menu
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...register("is_active")} className="sr-only peer" />
                <div className="w-11 h-6 bg-stone-200 dark:bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 dark:after:border-stone-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-750 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUploadingImgbb}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand-900 hover:bg-brand-950 dark:bg-emerald-700 dark:hover:bg-emerald-800 rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-gold-400" />
                    {isEdit ? "Update Category" : "Create Category"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Google Image Search Modal */}
      <GoogleImageSearchModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        defaultQuery={categoryName?.trim() || ""}
        onSelectImages={handleSelectFromGoogle}
        maxSelectable={1}
      />
    </>
  );
}
