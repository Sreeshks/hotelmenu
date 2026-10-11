"use client";

import React from "react";
import { Menu, ExternalLink, Sun, Moon } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSettings } from "@/components/providers/SettingsProvider";
import { CUSTOMER_MENU_URL } from "@/lib/constants";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onOpenMobile?: () => void;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, onOpenMobile, actions }: HeaderProps) {
  const { admin } = useAuth();
  const { isDarkMode, toggleTheme } = useSettings();

  return (
    <header className="h-20 bg-white/95 dark:bg-[#101513]/95 border-b border-stone-200/80 dark:border-stone-800 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs backdrop-blur-md transition-colors duration-200">
      <div className="flex items-center gap-4">
        {onOpenMobile && (
          <button
            onClick={onOpenMobile}
            className="lg:hidden p-2 text-stone-600 dark:text-stone-300 hover:text-brand-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
            aria-label="Open mobile navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          {title && (
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2">
              <span>{title}</span>
            </h1>
          )}
          {subtitle && <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* Theme Toggle Button (Light / Dark) */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800/90 border-stone-200 dark:border-stone-700 hover:border-gold-500 dark:hover:border-gold-400 shadow-2xs group"
        >
          {isDarkMode ? (
            <>
              <Sun className="w-3.5 h-3.5 text-gold-400 animate-in spin-in-90 duration-300" />
              <span className="hidden sm:inline text-gold-300">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-stone-600 group-hover:text-brand-900 animate-in spin-in-90 duration-300" />
              <span className="hidden sm:inline">Dark</span>
            </>
          )}
        </button>

        <a
          href={CUSTOMER_MENU_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-800 dark:text-emerald-300 bg-brand-50 dark:bg-brand-900/50 hover:bg-brand-100 dark:hover:bg-brand-800/60 border border-brand-200 dark:border-brand-700/60 rounded-xl transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 text-brand-700 dark:text-emerald-400" />
          <span>Customer Menu</span>
        </a>

        <div className="h-6 w-px bg-stone-200 dark:bg-stone-800 hidden md:block" />

        <div className="flex items-center gap-3 pl-1">
          <div className="hidden sm:block text-right">
            <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block leading-tight">{admin?.name || "Admin"}</span>
            <span className="text-[10px] text-stone-400 dark:text-stone-500 capitalize">{admin?.role || "Staff"}</span>
          </div>

          <div className="w-9 h-9 rounded-xl bg-brand-850 dark:bg-brand-800 text-gold-400 font-bold text-xs flex items-center justify-center border border-gold-500/20 shadow-sm uppercase">
            {admin?.name?.charAt(0) || "A"}
          </div>
        </div>
      </div>
    </header>
  );
}
