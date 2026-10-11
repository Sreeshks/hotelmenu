"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, X, RefreshCw, Layers, Utensils, AlertOctagon } from "lucide-react";
import { menuService } from "@/services/menu";
import { useToast } from "@/components/common/Toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTarget?: "all" | "products" | "categories";
  onSuccess?: () => void;
}

export function ClearDataModal({
  isOpen,
  onClose,
  defaultTarget = "all",
  onSuccess,
}: ClearDataModalProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [target, setTarget] = useState<"all" | "products" | "categories">(defaultTarget);
  const [confirmText, setConfirmText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset target when opened with a default
  React.useEffect(() => {
    if (isOpen) {
      setTarget(defaultTarget);
      setConfirmText("");
    }
  }, [isOpen, defaultTarget]);

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim().toUpperCase() === "CLEAR";

  const handleClear = async () => {
    if (!isConfirmed) return;

    setIsSubmitting(true);
    try {
      const res = await menuService.clearData(target);
      
      // Invalidate all related caches
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["customer-menu"] });

      addToast({
        type: "success",
        title: "Catalog Data Cleared",
        message: res.message || "Data has been successfully deleted.",
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to clear data. Please try again.";
      addToast({
        type: "error",
        title: "Clear Failed",
        message: typeof msg === "string" ? msg : JSON.stringify(msg),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 md:p-8 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1.5 rounded-xl transition-colors hover:bg-stone-100 disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-stone-900">
              Clear Menu Catalog Data
            </h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Permanently delete records from the menu database. This operation cannot be reversed.
            </p>
          </div>
        </div>

        {/* Target Options */}
        <div className="space-y-3 mb-6">
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
            Select Data Scope to Clear:
          </label>

          <div className="grid grid-cols-1 gap-2.5">
            {/* All Data */}
            <label
              className={cn(
                "flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer",
                target === "all"
                  ? "border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20"
                  : "border-stone-200 hover:border-stone-300 hover:bg-stone-50/50"
              )}
            >
              <input
                type="radio"
                name="clearTarget"
                value="all"
                checked={target === "all"}
                onChange={() => setTarget("all")}
                className="mt-1 text-rose-600 focus:ring-rose-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rose-600" />
                  <span className="text-sm font-semibold text-stone-900">
                    All Products & Categories
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Completely wipes all dish items, categories, and attached customer reviews.
                </p>
              </div>
            </label>

            {/* Products Only */}
            <label
              className={cn(
                "flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer",
                target === "products"
                  ? "border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20"
                  : "border-stone-200 hover:border-stone-300 hover:bg-stone-50/50"
              )}
            >
              <input
                type="radio"
                name="clearTarget"
                value="products"
                checked={target === "products"}
                onChange={() => setTarget("products")}
                className="mt-1 text-rose-600 focus:ring-rose-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-rose-600" />
                  <span className="text-sm font-semibold text-stone-900">
                    Products Only (Keep Categories)
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Deletes all dishes while keeping category titles and icons intact.
                </p>
              </div>
            </label>

            {/* Categories Only */}
            <label
              className={cn(
                "flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer",
                target === "categories"
                  ? "border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20"
                  : "border-stone-200 hover:border-stone-300 hover:bg-stone-50/50"
              )}
            >
              <input
                type="radio"
                name="clearTarget"
                value="categories"
                checked={target === "categories"}
                onChange={() => setTarget("categories")}
                className="mt-1 text-rose-600 focus:ring-rose-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rose-600" />
                  <span className="text-sm font-semibold text-stone-900">
                    Categories & Dependent Dishes
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Deletes all category headers and all associated dishes.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Confirmation Input for Safety */}
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 mb-6 space-y-2">
          <p className="text-xs text-stone-600">
            To confirm this destructive action, please type{" "}
            <span className="font-mono font-bold text-rose-600 uppercase select-all">CLEAR</span> below:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type CLEAR to confirm"
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 bg-white border border-stone-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 text-stone-900"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isConfirmed || isSubmitting}
            onClick={handleClear}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Clearing Data...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Permanently Clear Data</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
