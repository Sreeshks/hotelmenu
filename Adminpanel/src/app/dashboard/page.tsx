"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Utensils,
  Layers,
  Users,
  Star,
  Plus,
  RefreshCw,
  QrCode,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { OutOfStockAlert } from "@/components/dashboard/OutOfStockAlert";
import { ReviewChart } from "@/components/dashboard/ReviewChart";
import { PopularItems } from "@/components/dashboard/PopularItems";
import { TopStaff } from "@/components/dashboard/TopStaff";
import { RecentReviews } from "@/components/dashboard/RecentReviews";
import { dashboardService } from "@/services/dashboard";
import { menuService } from "@/services/menu";

export default function DashboardPage() {
  const {
    data: stats,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardService.getStats(),
  });

  // Query out-of-stock items for quick kitchen recovery
  const { data: outOfStockData } = useQuery({
    queryKey: ["menu-items", "out-of-stock"],
    queryFn: () => menuService.getMenuItems({ is_available: false, limit: 10 }),
  });

  const outOfStockItems = outOfStockData?.data || [];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Top Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gold-100 text-gold-900 border border-gold-300">
                <Star className="w-3 h-3 fill-gold-600 text-gold-600" />
                Live Dining Overview
              </span>
            </div>
            <h1 className="font-serif text-2xl lg:text-3xl font-bold text-brand-950 dark:text-stone-100 mt-1">
              Executive Dashboard
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Real-time monitoring of menu stock, culinary offerings, staff, and dining feedback.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-600 dark:text-stone-300 hover:text-brand-950 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shadow-sm disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
            </button>

            <Link
              href="/menu/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-950 dark:bg-brand-700 dark:hover:bg-brand-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4 text-gold-400" />
              <span>Add Dish</span>
            </Link>

            <Link
              href="/locations"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-700 hover:border-brand-900 dark:hover:border-gold-500 text-stone-700 dark:text-stone-200 hover:text-brand-950 dark:hover:text-white font-semibold text-sm shadow-sm transition-all"
            >
              <QrCode className="w-4 h-4 text-brand-700 dark:text-gold-400" />
              <span>Menu QR Code</span>
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-white rounded-2xl border border-stone-200 p-6 animate-pulse" />
              ))}
            </div>
            <div className="h-40 bg-white rounded-2xl border border-stone-200 p-6 animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-white rounded-2xl border border-stone-200 animate-pulse" />
              <div className="h-64 bg-white rounded-2xl border border-stone-200 animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            {/* KPI Metric Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard
                title="Total Dishes"
                value={stats?.total_menu_items ?? 0}
                subtitle={`${stats?.available_items ?? 0} available • ${stats?.out_of_stock_items ?? 0} out of stock`}
                icon={Utensils}
                variant="gold"
              />
              <StatCard
                title="Menu Categories"
                value={stats?.total_categories ?? 0}
                subtitle="Active culinary sections"
                icon={Layers}
              />
              <StatCard
                title="Hospitality Staff"
                value={stats?.total_staff ?? 0}
                subtitle="On-duty service team"
                icon={Users}
              />
              <StatCard
                title="Guest Rating"
                value={
                  stats?.average_restaurant_rating
                    ? `${stats.average_restaurant_rating.toFixed(1)} / 5.0`
                    : "5.0 / 5.0"
                }
                subtitle={`From ${stats?.total_reviews ?? 0} verified dining reviews`}
                icon={Star}
                variant="gold"
              />
            </div>

            {/* Out of Stock Alert Banner */}
            <OutOfStockAlert items={outOfStockItems} />

            {/* Main Visuals: Review Trends & Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ReviewChart stats={stats} />
              </div>
              <div>
                <PopularItems items={stats?.popular_items ?? []} />
              </div>
            </div>

            {/* Bottom Row: Top Staff & Recent Reviews */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopStaff staffList={stats?.top_staff ?? []} />
              <RecentReviews reviews={stats?.recent_reviews ?? []} />
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
