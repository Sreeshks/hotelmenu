import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode | React.ComponentType<{ className?: string }>;
  variant?: "default" | "warning" | "success" | "gold";
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = "default",
}: StatCardProps) {
  const renderedIcon = React.isValidElement(icon)
    ? icon
    : typeof icon === "function" || typeof icon === "object"
    ? React.createElement(icon as any, { className: "w-5 h-5" })
    : icon;

  return (
    <div
      className={cn(
        "p-5 rounded-2xl border transition-all duration-200 bg-white dark:bg-[#11161e] border-stone-200/90 dark:border-white/[0.08] hover:dark:border-white/[0.18] shadow-card dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] flex items-start justify-between gap-3 group hover:shadow-soft hover:translate-y-[-2px]",
        variant === "gold" && "hover:border-gold-400 dark:hover:border-gold-500/40",
        variant === "default" && "hover:border-brand-500/40 dark:hover:border-emerald-500/40",
        variant === "warning" && "hover:border-amber-400 dark:hover:border-amber-500/40",
        variant === "success" && "hover:border-emerald-400 dark:hover:border-emerald-500/40"
      )}
    >
      <div className="space-y-1">
        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 dark:text-white tracking-tight">{value}</p>
        {subtitle && <p className="text-xs text-stone-400 dark:text-stone-400">{subtitle}</p>}
      </div>

      <div
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
          variant === "default" && "bg-brand-50 dark:bg-emerald-500/10 text-brand-850 dark:text-emerald-400 border border-brand-100 dark:border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.12)]",
          variant === "warning" && "bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.12)]",
          variant === "success" && "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.12)]",
          variant === "gold" && "bg-gold-100 dark:bg-gold-500/10 text-gold-700 dark:text-gold-400 border border-gold-200 dark:border-gold-500/25 shadow-[0_0_12px_rgba(217,173,72,0.15)]"
        )}
      >
        {renderedIcon}
      </div>
    </div>
  );
}
