"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Image as ImageIcon,
  Edit2,
  Trash2,
  RefreshCw,
  ExternalLink,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { BannerFormModal } from "@/components/banners/BannerFormModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { bannerService } from "@/services/banners";
import { useToast } from "@/components/common/Toast";
import { Banner } from "@/types";
import { resolveImageUrl, formatDate } from "@/lib/utils";

export default function BannersPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);

  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: banners = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["banners"],
    queryFn: () => bannerService.getBanners(),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      bannerService.updateBanner(id, { is_active }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      addToast({
        type: "success",
        title: updated.is_active ? "Banner Activated" : "Banner Deactivated",
        message: `"${updated.title}" display status updated.`,
      });
    },
    onError: () => {
      addToast({
        type: "error",
        title: "Action Failed",
        message: "Failed to update banner status.",
      });
    },
  });

  const handleDelete = async () => {
    if (!bannerToDelete) return;
    setIsDeleting(true);
    try {
      await bannerService.deleteBanner(bannerToDelete.id);
      addToast({
        type: "success",
        title: "Banner Removed",
        message: `"${bannerToDelete.title}" has been deleted.`,
      });
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      setBannerToDelete(null);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Deletion Failed",
        message: "Could not delete this promotional banner.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedBanner(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner: Banner) => {
    setSelectedBanner(banner);
    setIsModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl lg:text-3xl font-bold text-brand-950 dark:text-stone-100">
              Promotional Banners
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Curate seasonal promotions, chef tasting menus, and culinary events on the guest hero carousel.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-brand-950 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors shadow-sm disabled:opacity-50"
              title="Refresh Banners"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-950 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4 text-gold-400 dark:text-gold-300" />
              <span>New Banner</span>
            </button>
          </div>
        </div>

        {/* Banners Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-white dark:bg-[#121815] rounded-3xl border border-stone-200 dark:border-stone-800 animate-pulse" />
            ))}
          </div>
        ) : banners.length === 0 ? (
          <div className="bg-white dark:bg-[#121815] rounded-3xl border border-stone-200 dark:border-stone-800 p-8 shadow-sm">
            <EmptyState
              title="No Promotional Banners Active"
              description="Create hero banners to showcase chef recommendations, wine pairings, and holiday dining specials."
              action={{
                label: "Create Banner",
                onClick: handleOpenCreate,
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="bg-white dark:bg-[#121815] rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Banner Visual Preview */}
                <div className="relative h-48 w-full bg-stone-900 overflow-hidden group">
                  <Image
                    src={resolveImageUrl(banner.image_url)}
                    alt={banner.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />

                  {/* Badges on Banner */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-brand-950/80 backdrop-blur-md text-gold-300 font-semibold border border-gold-500/20">
                      Order: #{banner.display_order}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-serif text-xl font-bold text-white tracking-wide">
                      {banner.title}
                    </h3>
                    {banner.subtitle && (
                      <p className="text-xs text-stone-200 line-clamp-1 mt-0.5 font-light">
                        {banner.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Metadata & Description */}
                <div className="p-6 space-y-4">
                  {banner.description && (
                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                      {banner.description}
                    </p>
                  )}

                  {/* CTA & Dates */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800 gap-2">
                    {banner.button_text ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-brand-900 dark:text-emerald-400 bg-brand-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                        <ExternalLink className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
                        CTA: &quot;{banner.button_text}&quot;
                      </span>
                    ) : (
                      <span className="text-stone-400 dark:text-stone-500 italic">No CTA button set</span>
                    )}

                    <div className="flex items-center gap-1 text-[11px] text-stone-400 dark:text-stone-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {banner.start_date ? formatDate(banner.start_date) : "Immediate"} -{" "}
                      {banner.end_date ? formatDate(banner.end_date) : "Ongoing"}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-3.5 bg-stone-50/80 dark:bg-stone-900/60 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <button
                    onClick={() =>
                      toggleStatusMutation.mutate({
                        id: banner.id,
                        is_active: !banner.is_active,
                      })
                    }
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                      banner.is_active
                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                        : "bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-300 dark:hover:bg-stone-700"
                    }`}
                  >
                    {banner.is_active ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Active on Carousel
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-stone-500" />
                        Inactive / Hidden
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(banner)}
                      className="p-1.5 text-stone-600 dark:text-stone-400 hover:text-brand-900 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-stone-800 rounded-lg transition-colors"
                      title="Edit Banner"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setBannerToDelete(banner)}
                      className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                      title="Delete Banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Banner Create/Edit Modal */}
      <BannerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        banner={selectedBanner}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!bannerToDelete}
        onClose={() => setBannerToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Promotional Banner"
        message={`Are you sure you want to remove the banner "${bannerToDelete?.title}"?`}
        confirmText="Yes, Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </AdminLayout>
  );
}
