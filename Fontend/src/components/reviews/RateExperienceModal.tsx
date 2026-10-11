"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Star,
  Utensils,
  Award,
  Building,
  Upload,
  CheckCircle2,
  Loader2,
  Sparkles,
  Camera,
  User,
} from "lucide-react";
import { MenuItem, Staff, ReviewCreate } from "@/types";
import { reviewService } from "@/services/reviews";
import { staffService } from "@/services/staff";
import { useToast } from "@/components/common/Toast";
import { getCustomerIdentifier, resolveImageUrl, formatPrice } from "@/lib/utils";

interface RateExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  preselectedItem?: MenuItem | null;
  locationId?: number | null;
  currency?: string;
  onSuccess?: () => void;
}

type RatingType = "MENU_ITEM" | "STAFF" | "RESTAURANT";

export function RateExperienceModal({
  isOpen,
  onClose,
  menuItems,
  preselectedItem,
  locationId,
  currency,
  onSuccess,
}: RateExperienceModalProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<RatingType>(
    preselectedItem ? "MENU_ITEM" : "RESTAURANT"
  );

  // Form Fields
  const [rating, setRating] = useState<number>(5);
  const [customerName, setCustomerName] = useState<string>("");
  const [reviewText, setReviewText] = useState<string>("");

  // Specific Targets
  const [selectedItemId, setSelectedItemId] = useState<number | null>(
    preselectedItem?.id || null
  );
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);

  // Photo uploads
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  // State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Fetch staff list for staff rating tab
  const { data: staffList = [] } = useQuery({
    queryKey: ["active-staff"],
    queryFn: () => staffService.getActiveStaff(),
    enabled: isOpen && activeTab === "STAFF",
  });

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    if (uploadedImages.length >= 3) {
      addToast({
        type: "warning",
        title: "Photo Limit Reached",
        message: "You can upload a maximum of 3 photos per review.",
      });
      return;
    }

    const file = e.target.files[0];
    setIsUploadingImage(true);
    try {
      const url = await reviewService.uploadReviewImage(file);
      setUploadedImages((prev) => [...prev, url]);
      addToast({
        type: "success",
        title: "Photo Attached",
        message: "Your dining photograph has been attached.",
      });
    } catch {
      addToast({
        type: "error",
        title: "Upload Failed",
        message: "Could not upload image. Please try again.",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "MENU_ITEM" && !selectedItemId) {
      addToast({
        type: "warning",
        title: "Select Dish",
        message: "Please choose which dish you'd like to review.",
      });
      return;
    }

    if (activeTab === "STAFF" && !selectedStaffId) {
      addToast({
        type: "warning",
        title: "Select Server",
        message: "Please choose which staff member attended your table.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ReviewCreate = {
        customer_name: customerName.trim() || "Valued Guest",
        customer_identifier: getCustomerIdentifier(),
        review_type: activeTab,
        rating,
        review_text: reviewText.trim() || undefined,
        menu_item_id: activeTab === "MENU_ITEM" ? (selectedItemId as number) : undefined,
        staff_id: activeTab === "STAFF" ? (selectedStaffId as number) : undefined,
        location_id: locationId || undefined,
        image_urls: uploadedImages,
      };

      await reviewService.submitReview(payload);

      // Invalidate query caches
      queryClient.invalidateQueries({ queryKey: ["customer-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["all-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["dish-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["item-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["customer-menu"] });

      setIsSubmitted(true);
      onSuccess?.();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to submit review.";
      addToast({
        type: "error",
        title: "Submission Notice",
        message: typeof msg === "string" ? msg : JSON.stringify(msg),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setRating(5);
    setReviewText("");
    setCustomerName("");
    setUploadedImages([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-950/70 backdrop-blur-sm"
        onClick={handleResetAndClose}
      />

      {/* Modal / Bottom Sheet */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-surface-border overflow-hidden z-10 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300">
        {/* Success View */}
        {isSubmitted ? (
          <div className="p-8 text-center space-y-5 my-auto">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-2xl font-bold text-brand-950">
                Thank You!
              </h3>
              <p className="text-sm font-medium text-emerald-700">
                Your review has been submitted.
              </p>
              <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
                Your feedback helps our culinary and service teams continuously refine your dining experience.
              </p>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full py-3.5 px-6 rounded-2xl bg-brand-900 hover:bg-brand-950 text-white font-semibold text-sm transition-colors shadow-md mt-4"
            >
              Back to Menu
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-5 border-b border-surface-border flex items-center justify-between bg-surface-bg/50">
              <div>
                <h3 className="font-serif text-lg font-bold text-brand-950">
                  Rate Your Experience
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Share your compliments or suggestions with our team
                </p>
              </div>
              <button
                onClick={handleResetAndClose}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type Selection Tabs */}
            <div className="px-6 pt-4 pb-2 border-b border-surface-border/60">
              <div className="grid grid-cols-3 gap-2 p-1 bg-surface-bg rounded-2xl border border-surface-border">
                <button
                  type="button"
                  onClick={() => setActiveTab("MENU_ITEM")}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === "MENU_ITEM"
                      ? "bg-brand-900 text-white shadow-sm"
                      : "text-text-secondary hover:text-brand-950"
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5 text-gold-400" />
                  <span>Food Dish</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("STAFF")}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === "STAFF"
                      ? "bg-brand-900 text-white shadow-sm"
                      : "text-text-secondary hover:text-brand-950"
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-gold-400" />
                  <span>Server</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("RESTAURANT")}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === "RESTAURANT"
                      ? "bg-brand-900 text-white shadow-sm"
                      : "text-text-secondary hover:text-brand-950"
                  }`}
                >
                  <Building className="w-3.5 h-3.5 text-gold-400" />
                  <span>Ambience</span>
                </button>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Star Rating Selector */}
              <div className="text-center p-4 bg-gold-50/50 rounded-2xl border border-gold-200/50 space-y-2">
                <p className="text-xs font-semibold text-brand-950 uppercase tracking-wider">
                  How would you rate this?
                </p>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-gold-500 hover:scale-110 transition-transform focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? "fill-gold-500 text-gold-500"
                            : "fill-stone-200 text-stone-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-serif font-bold text-gold-900">
                  {rating === 5 && "Exceptional & Exquisite"}
                  {rating === 4 && "Great Experience"}
                  {rating === 3 && "Satisfactory"}
                  {rating === 2 && "Could Be Better"}
                  {rating === 1 && "Disappointing"}
                </p>
              </div>

              {/* Target Selection: Food Dish */}
              {activeTab === "MENU_ITEM" && (
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                    Which dish did you try? <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedItemId || ""}
                    onChange={(e) => setSelectedItemId(Number(e.target.value) || null)}
                    className="w-full px-4 py-3 bg-surface-bg border border-surface-border rounded-xl text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-800"
                  >
                    <option value="">Select a dish from the menu...</option>
                    {menuItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({formatPrice(item.price, currency)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Target Selection: Waitstaff Member */}
              {activeTab === "STAFF" && (
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Select Your Service Personnel <span className="text-rose-500">*</span>
                  </label>
                  {staffList.length === 0 ? (
                    <p className="text-xs text-text-muted italic">
                      No on-duty staff available to select.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
                      {staffList.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => setSelectedStaffId(st.id)}
                          className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                            selectedStaffId === st.id
                              ? "bg-brand-900 text-white border-brand-900 shadow-sm"
                              : "bg-surface-bg/60 border-surface-border hover:bg-stone-50"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-200 relative shrink-0">
                            {st.profile_image ? (
                              <Image
                                src={resolveImageUrl(st.profile_image)}
                                alt={st.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-xs text-stone-600">
                                {st.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate">{st.name}</p>
                            <p className="text-[10px] opacity-80 truncate">{st.designation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Guest Name */}
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. John D. (or leave blank for Anonymous)"
                  className="w-full px-4 py-2.5 bg-surface-bg border border-surface-border rounded-xl text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-800"
                />
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Written Feedback
                </label>
                <textarea
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Describe the flavor, presentation, or dining atmosphere..."
                  className="w-full px-4 py-2.5 bg-surface-bg border border-surface-border rounded-xl text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-800 resize-none"
                />
              </div>

              {/* Photo Upload (max 3) */}
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Attach Dish Photos (Max 3)
                </label>
                <div className="flex items-center gap-2">
                  {uploadedImages.map((img, i) => (
                    <div
                      key={i}
                      className="relative w-14 h-14 rounded-xl overflow-hidden border border-stone-200"
                    >
                      <Image
                        src={resolveImageUrl(img)}
                        alt="Attached photo"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}

                  {uploadedImages.length < 3 && (
                    <label className="w-14 h-14 rounded-xl border-2 border-dashed border-stone-300 hover:border-brand-800 bg-surface-bg flex flex-col items-center justify-center cursor-pointer transition-colors text-stone-400 hover:text-brand-900">
                      <Camera className="w-5 h-5" />
                      <span className="text-[9px] mt-0.5 font-medium">+ Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                    </label>
                  )}

                  {isUploadingImage && (
                    <div className="flex items-center gap-1.5 text-xs text-stone-500">
                      <Loader2 className="w-4 h-4 animate-spin text-gold-500" />
                      <span>Uploading...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingImage}
                  className="w-full py-3.5 px-6 rounded-2xl bg-brand-900 hover:bg-brand-950 text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
                      Submitting Feedback...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-gold-400" />
                      Submit Review
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
