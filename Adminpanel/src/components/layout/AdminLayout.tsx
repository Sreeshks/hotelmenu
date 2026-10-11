"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "@/components/providers/AuthProvider";
import { Loader2 } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AdminLayout({ children, title, subtitle, actions }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-[#0b0f14]">
        <div className="w-12 h-12 rounded-2xl bg-brand-900 flex items-center justify-center shadow-lg text-gold-400 mb-4 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-serif font-medium text-stone-700 dark:text-stone-300">Loading Grand Menu Administration...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // AuthProvider will redirect to /login
  }

  return (
    <div className="min-h-screen flex bg-surface-bg dark:bg-[#0b0f14] text-stone-900 dark:text-stone-100 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0 sticky top-0 h-screen z-40">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 lg:hidden transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onCloseMobile={() => setMobileOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={title}
          subtitle={subtitle}
          onOpenMobile={() => setMobileOpen(true)}
          actions={actions}
        />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
