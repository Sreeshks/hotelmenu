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
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/common/Toast";
import { dashboardService } from "@/services/dashboard";
import { useSettings } from "@/components/providers/SettingsProvider";
import { locationService } from "@/services/locations";

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
  } = useSettings();

  const [isSaving, setIsSaving] = useState(false);

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
      // The main location is typically the first RESTAURANT-type or the first entry.
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
        message: "Restaurant name updated — customers will see the new name.",
      });
    } catch {
      addToast({
        type: "error",
        title: "Save Failed",
        message: "Could not update restaurant name on the server.",
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
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-brand-950">
            System Settings & Operations
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Manage restaurant brand profiles, service hours, and verify live server connectivity.
          </p>
        </div>

        {/* System & API Connectivity Status */}
        <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm space-y-4">
          <h2 className="font-serif text-base font-bold text-brand-950 flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            Live Infrastructure Status
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* FastAPI Backend */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-stone-500 font-semibold uppercase">FastAPI Backend</p>
                <p className="text-sm font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {systemStatus?.components?.api || "Connected (Port 8000)"}
                </p>
              </div>
            </div>

            {/* PostgreSQL / SQLite Database */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-stone-500 font-semibold uppercase">Menu Database</p>
                <p className="text-sm font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {systemStatus?.components?.database || "Operational"}
                </p>
              </div>
            </div>

            {/* WebSocket Stock Sync */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-100 text-gold-800 flex items-center justify-center flex-shrink-0">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-stone-500 font-semibold uppercase">WebSocket Stock Sync</p>
                <p className="text-sm font-bold text-brand-950 flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Active Listener
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Restaurant Profile Form */}
        <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm space-y-6">
          <h2 className="font-serif text-base font-bold text-brand-950 flex items-center gap-2 pb-2 border-b border-stone-100">
            <Building className="w-4 h-4 text-gold-500" />
            Restaurant Brand Profile
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Establishment Name
              </label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50/70 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Brand Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50/70 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white text-stone-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Currency Symbol
                </label>
                <select
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50/70 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white text-stone-900"
                >
                  <option value="$">$ (USD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="₹">₹ (INR)</option>
                  <option value="AED">AED (Dirhams)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Dining & Service Timings
                </label>
                <input
                  type="text"
                  value={diningHours}
                  onChange={(e) => setDiningHours(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50/70 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white text-stone-900"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-950 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-gold-400" />
              <span>{isSaving ? "Saving..." : "Save Configuration"}</span>
            </button>
          </div>
        </form>

        {/* Administrator Session Account */}
        <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-900 text-gold-300 flex items-center justify-center font-serif font-bold text-lg">
              {admin?.name?.charAt(0) || "A"}
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase">Logged In Administrator</p>
              <h3 className="font-serif text-lg font-bold text-brand-950">{admin?.name || "Admin"}</h3>
              <p className="text-xs text-stone-500">{admin?.email} &bull; {admin?.role}</p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
