"use client";

import React from "react";
import { FolderOpen, Plus } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  action?: { label: string; onClick: () => void };
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionText,
  onAction,
  action,
  icon,
}: EmptyStateProps) {
  const btnText = action?.label || actionText;
  const btnAction = action?.onClick || onAction;

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#121815] border border-dashed border-stone-300 dark:border-stone-800 rounded-2xl">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-emerald-950/40 border border-brand-100 dark:border-emerald-900/50 flex items-center justify-center text-brand-700 dark:text-emerald-400 mb-4 shadow-sm">
        {icon || <FolderOpen className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-1">{title}</h3>
      <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      {btnText && btnAction && (
        <button
          onClick={btnAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-850 hover:bg-brand-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl shadow-md shadow-brand-900/10 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4 text-gold-400 dark:text-gold-300" />
          <span>{btnText}</span>
        </button>
      )}
    </div>
  );
}
