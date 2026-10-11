"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  variant?: "danger" | "default";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = true,
  variant,
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const dialogText = description || message || "";
  const isDanger = variant === "danger" || (isDestructive && variant !== "default");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#121815] rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
              isDanger
                ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50"
                : "bg-brand-50 dark:bg-emerald-950/40 text-brand-700 dark:text-emerald-400 border border-brand-200 dark:border-emerald-900/50"
            )}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{title}</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">{dialogText}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={cn(
              "px-4 py-2 text-sm font-medium text-white rounded-xl shadow-sm transition-all disabled:opacity-50",
              isDanger
                ? "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                : "bg-brand-800 hover:bg-brand-900 shadow-brand-800/20"
            )}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
