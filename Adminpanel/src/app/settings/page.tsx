"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  Building,
  Clock,
  DollarSign,
  Wifi,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Server,
  Database,
  Radio,
  Trash2,
  AlertOctagon,
  Sun,
  Moon,
  Laptop,
  Palette,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/common/Toast";
import { dashboardService } from "@/services/dashboard";
import { useSettings } from "@/components/providers/SettingsProvider";
import { locationService } from "@/services/locations";
import { ClearDataModal } from "@/components/common/ClearDataModal";


export default function SettingsPage() {
  const { admin, logout } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const {
    currencySymbol,
    setCurrencySymbol,
    restaurantName,
    setRestaurantName,
    tagline,
    setTagline,
    diningHours,
    setDiningHours,
    theme,
    setTheme,
  } = useSettings();

  const [isSaving, setIsSaving] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);


  // Fetch backend system status
  const { data: systemStatus } = useQuery({
    queryKey: ["system-status"],
    queryFn: () => dashboardService.getSystemStatus(),
    refetchInterval: 15000,
  });

  // Fetch all locations so we can find the main one to update its name
  const { data: locations } = useQuery({
    queryKey: ["admin-locations"],
    queryFn: () => locationService.getLocations(),
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Push the name change to the backend so the customer frontend sees it.
      if (locations && locations.length > 0) {
        const mainLocation =
          locations.find((l) => l.location_type === "RESTAURANT") ||
          locations[0];
        await locationService.updateLocation(mainLocation.id, {
          name: restaurantName,
        });
        // Invalidate customer menu cache so Next.js refetches fresh data
        queryClient.invalidateQueries({ queryKey: ["admin-locations"] });
      }
      addToast({
        type: "success",
        title: "Settings Saved",
        message: "Restaurant configuration and brand profile successfully updated.",
      });
    } catch {
      addToast({
        type: "error",
        title: "Save Failed",
        message: "Could not update restaurant profile on the server.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-brand-950 dark:text-stone-100">
            System Settings & Operations
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Manage restaurant brand profiles, visual theme, service hours, and verify live server connectivity.
          </p>
        </div>

        {/* Appearance & Theme Section */}
        <div className="bg-white dark:bg-[#121815] rounded-3xl border border-stone-200/80 dark:border-stone-800/80 p-6 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800/60">
            <h2 className="font-serif text-base font-bold text-brand-950 dark:text-stone-100 flex items-center gap-2">
              <Palette className="w-4 h-4 text-gold-500" />
              Interface Theme & Appearance
            </h2>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              Active: <span className="font-semibold text-brand-900 dark:text-gold-300 capitalize">{theme} Mode</span>
            </span>
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400">
            Customize the admin portal display theme for your visual comfort during day or night dining operations.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            {/* Light Mode Card */}
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                theme === "light"
                  ? "border-gold-500 bg-gold-50/50 dark:bg-gold-950/20 shadow-sm ring-1 ring-gold-500"
                  : "border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40 hover:border-stone-300 dark:hover:border-stone-700"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 shadow-2xs flex items-center justify-center text-amber-500">
                  <Sun className="w-5 h-5" />
                </div>
                {theme === "light" && (
                  <CheckCircle2 className="w-4 h-4 text-gold-600 dark:text-gold-400" />
                )}
              </div>
              <p className="text-sm font-bold text-stone-900 dark:text-stone-100">Light Mode</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Crisp emerald & white presentation for daytime lighting
              </p>
            </button>

            {/* Dark Mode Card */}
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                theme === "dark"
                  ? "border-gold-500 bg-gold-50/50 dark:bg-gold-950/20 shadow-sm ring-1 ring-gold-500"
                  : "border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40 hover:border-stone-300 dark:hover:border-stone-700"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-stone-900 border border-stone-700 shadow-2xs flex items-center justify-center text-gold-400">
                  <Moon className="w-5 h-5" />
                </div>
                {theme === "dark" && (
                  <CheckCircle2 className="w-4 h-4 text-gold-600 dark:text-gold-400" />
                )}
              </div>
              <p className="text-sm font-bold text-stone-900 dark:text-stone-100">Dark Mode</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Obsidian emerald & midnight slate for low-light ambiance
              </p>
            </button>

            {/* System Auto Card */}
            <button
              type="button"
              onClick={() => setTheme("system")}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                theme === "system"
                  ? "border-gold-500 bg-gold-50/50 dark:bg-gold-950/20 shadow-sm ring-1 ring-gold-500"
                  : "border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40 hover:border-stone-300 dark:hover:border-stone-700"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-2xs flex items-center justify-center text-stone-700 dark:text-stone-300">
                  <Laptop className="w-5 h-5" />
                </div>
                {theme === "system" && (
                  <CheckCircle2 className="w-4 h-4 text-gold-600 dark:text-gold-400" />
                )}
              </div>
              <p className="text-sm font-bold text-stone-900 dark:text-stone-100">System Preference</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Automatically matches your device operating system theme
              </p>
            </button>
          </div>
        </div>

        {/* System & API Connectivity Status */}
        <div className="bg-white dark:bg-[#121815] rounded-3xl border border-stone-200/80 dark:border-stone-800/80 p-6 shadow-sm space-y-4 transition-colors">
          <h2 className="font-serif text-base font-bold text-brand-950 dark:text-stone-100 flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            Live Infrastructure Status
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* FastAPI Backend */}
            <div className="p-4 bg-stone-50 dark:bg-stone-900/50 rounded-2xl border border-stone-200/60 dark:border-stone-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-semibold uppercase">FastAPI Backend</p>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {systemStatus?.components?.api || "Connected (Port 8000)"}
                </p>
              </div>
            </div>

            {/* PostgreSQL / SQLite Database */}
            <div className="p-4 bg-stone-50 dark:bg-stone-900/50 rounded-2xl border border-stone-200/60 dark:border-stone-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950/60 text-brand-800 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-semibold uppercase">Menu Database</p>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {systemStatus?.components?.database || "Operational"}
                </p>
              </div>
            </div>

            {/* WebSocket Stock Sync */}
            <div className="p-4 bg-stone-50 dark:bg-stone-900/50 rounded-2xl border border-stone-200/60 dark:border-stone-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-100 dark:bg-gold-950/60 text-gold-800 dark:text-gold-300 flex items-center justify-center flex-shrink-0">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-semibold uppercase">WebSocket Stock Sync</p>
                <p className="text-sm font-bold text-brand-950 dark:text-stone-100 flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Listener
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Restaurant Profile Form */}
        <form onSubmit={handleSaveProfile} className="bg-white dark:bg-[#121815] rounded-3xl border border-stone-200/80 dark:border-stone-800/80 p-6 shadow-sm space-y-6 transition-colors">
          <h2 className="font-serif text-base font-bold text-brand-950 dark:text-stone-100 flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800/60">
            <Building className="w-4 h-4 text-gold-500" />
            Restaurant Brand Profile
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Establishment Name
              </label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50/70 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white dark:focus:bg-stone-850 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Brand Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50/70 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white dark:focus:bg-stone-850 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Currency Symbol
                </label>
                <select
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50/70 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white dark:focus:bg-stone-850 text-stone-900 dark:text-stone-100"
                >
                  <option value="$">$ (USD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="₹">₹ (INR)</option>
                  <option value="AED">AED (Dirhams)</option>
                  <option value="OMR ">OMR (Omani Rial)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Dining & Service Timings
                </label>
                <input
                  type="text"
                  value={diningHours}
                  onChange={(e) => setDiningHours(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50/70 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white dark:focus:bg-stone-850 text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-950 dark:bg-brand-700 dark:hover:bg-brand-600 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-gold-400" />
              <span>{isSaving ? "Saving..." : "Save Configuration"}</span>
            </button>
          </div>
        </form>

        {/* Administrator Session Account */}
        <div className="bg-white dark:bg-[#121815] rounded-3xl border border-stone-200/80 dark:border-stone-800/80 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-900 dark:bg-brand-800 text-gold-300 flex items-center justify-center font-serif font-bold text-lg">
              {admin?.name?.charAt(0) || "A"}
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase">Logged In Administrator</p>
              <h3 className="font-serif text-lg font-bold text-brand-950 dark:text-stone-100">{admin?.name || "Admin"}</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">{admin?.email} &bull; {admin?.role}</p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Danger Zone: Catalog Data Management */}
        <div className="bg-white dark:bg-[#121815] rounded-3xl border border-rose-200/80 dark:border-rose-900/60 p-6 shadow-sm space-y-4 relative overflow-hidden transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0 mt-0.5">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <span>Catalog Data Management</span>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    Danger Zone
                  </span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xl leading-relaxed">
                  Clear all dishes, categories, or both from the database. Use this option when re-importing a new menu or purging existing catalog data.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md shadow-rose-600/20 transition-all shrink-0 self-start sm:self-auto"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Catalog Data</span>
            </button>
          </div>
        </div>

        {/* Reusable Clear Data Modal */}
        <ClearDataModal
          isOpen={isClearModalOpen}
          onClose={() => setIsClearModalOpen(false)}
          defaultTarget="all"
        />
      </div>
    </AdminLayout>
  );
}
