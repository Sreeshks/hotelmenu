"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Utensils,
  Award,
  Building,
  Filter,
  MessageSquare,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ReviewDetailsModal } from "@/components/reviews/ReviewDetailsModal";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { reviewService, ReviewFilterParams } from "@/services/reviews";
import { useToast } from "@/components/common/Toast";
import { Review } from "@/types";
import { resolveImageUrl, formatDate } from "@/lib/utils";

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [selectedType, setSelectedType] = useState<"ALL" | "MENU_ITEM" | "STAFF" | "RESTAURANT">("ALL");
  const [approvalFilter, setApprovalFilter] = useState<"ALL" | "PENDING" | "APPROVED">("ALL");
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const filterParams: ReviewFilterParams = {
    review_type: selectedType === "ALL" ? undefined : selectedType,
    is_approved:
      approvalFilter === "ALL" ? undefined : approvalFilter === "APPROVED" ? true : false,
    page,
    limit,
  };

  const {
    data: reviewsResponse,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["reviews", filterParams],
    queryFn: () => reviewService.getReviews(filterParams),
  });

  const reviews = reviewsResponse?.data || [];
  const pagination = reviewsResponse?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1,
  };

  // Toggle approval mutation
  const toggleApprovalMutation = useMutation({
    mutationFn: ({ id, is_approved }: { id: number; is_approved: boolean }) =>
      reviewService.approveReview(id, is_approved),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      addToast({
        type: "success",
        title: updated.is_approved ? "Review Approved" : "Approval Revoked",
        message: `Review #${updated.id} status updated.`,
      });
    },
    onError: () => {
      addToast({
        type: "error",
        title: "Action Failed",
        message: "Failed to update review approval status.",
      });
    },
  });

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ id, is_visible }: { id: number; is_visible: boolean }) =>
      reviewService.setVisibility(id, is_visible),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      addToast({
        type: "success",
        title: updated.is_visible ? "Review Visible" : "Review Hidden",
        message: `Review #${updated.id} visibility updated.`,
      });
    },
    onError: () => {
      addToast({
        type: "error",
        title: "Action Failed",
        message: "Failed to update review visibility.",
      });
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl lg:text-3xl font-bold text-brand-950 dark:text-stone-100">
              Guest Feedback & Reviews
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Moderate and monitor guest ratings across dishes, waitstaff, and dining ambience.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-brand-950 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors shadow-sm disabled:opacity-50"
              title="Refresh Reviews"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white dark:bg-[#121815] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Review Type Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "ALL", label: "All Reviews", icon: null },
              { id: "MENU_ITEM", label: "Menu Dishes", icon: Utensils },
              { id: "STAFF", label: "Waitstaff", icon: Award },
              { id: "RESTAURANT", label: "Ambience", icon: Building },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedType(tab.id as any);
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedType === tab.id
                      ? "bg-brand-900 dark:bg-emerald-600 text-white shadow-sm"
                      : "bg-stone-50 dark:bg-stone-900/60 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800"
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 text-gold-400" />}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Approval Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Status:
            </span>
            <div className="inline-flex rounded-xl bg-stone-100 dark:bg-stone-900 p-1 border border-stone-200 dark:border-stone-800 text-xs">
              {(["ALL", "PENDING", "APPROVED"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setApprovalFilter(status);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    approvalFilter === status
                      ? "bg-white dark:bg-stone-800 text-brand-950 dark:text-stone-100 font-bold shadow-sm"
                      : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                  }`}
                >
                  {status === "ALL" ? "All" : status === "PENDING" ? "Pending" : "Approved"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white dark:bg-[#121815] rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-stone-50 dark:bg-stone-900/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-12">
              <EmptyState
                title="No Reviews Found"
                description="There are currently no guest feedback submissions matching the selected filters."
              />
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="p-5 hover:bg-stone-50/50 dark:hover:bg-stone-850/50 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  {/* Left Side: Rating, Subject, Content */}
                  <div className="space-y-2 flex-1 cursor-pointer" onClick={() => setSelectedReview(r)}>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Star Rating */}
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= r.rating
                                ? "fill-gold-500 text-gold-500"
                                : "fill-stone-200 dark:fill-stone-700 text-stone-200 dark:text-stone-700"
                            }`}
                          />
                        ))}
                      </div>

                      {/* Review Type Badge */}
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                        {r.review_type.replace("_", " ")}
                      </span>

                      {/* Approval Status Badge */}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          r.is_approved
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                            : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                        }`}
                      >
                        {r.is_approved ? "Approved" : "Pending Moderation"}
                      </span>

                      {!r.is_visible && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
                          Hidden
                        </span>
                      )}
                    </div>

                    {/* Target & Diner details */}
                    <div className="text-sm font-semibold text-brand-950 dark:text-stone-100 flex flex-wrap items-center gap-2">
                      <span>
                        {r.menu_item_name ||
                          r.staff_name ||
                          (r.location_name ? `${r.location_name}` : "Overall Dining Ambience")}
                      </span>
                      <span className="text-stone-300 dark:text-stone-600">•</span>
                      <span className="text-xs font-normal text-stone-500 dark:text-stone-400">
                        by {r.customer_name || "Anonymous Guest"}
                      </span>
                      <span className="text-stone-300 dark:text-stone-600">•</span>
                      <span className="text-xs font-normal text-stone-400 dark:text-stone-500">
                        {formatDate(r.created_at)}
                      </span>
                    </div>

                    {/* Review text */}
                    {r.review_text && (
                      <p className="text-xs text-stone-600 dark:text-stone-400 italic line-clamp-2">
                        &quot;{r.review_text}&quot;
                      </p>
                    )}

                    {/* Attached Photo Indicators */}
                    {r.images && r.images.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        {r.images.map((img) => (
                          <div
                            key={img.id}
                            className="relative w-10 h-10 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700"
                          >
                            <Image
                              src={resolveImageUrl(img.image_url)}
                              alt="Guest review photo"
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Side: Quick Action Moderation Buttons */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                    <button
                      onClick={() =>
                        toggleApprovalMutation.mutate({
                          id: r.id,
                          is_approved: !r.is_approved,
                        })
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        r.is_approved
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-900/40"
                          : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                      }`}
                    >
                      {r.is_approved ? (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          Revoke
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </>
                      )}
                    </button>

                    <button
                      onClick={() =>
                        toggleVisibilityMutation.mutate({
                          id: r.id,
                          is_visible: !r.is_visible,
                        })
                      }
                      className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                      title={r.is_visible ? "Hide Review" : "Show Review"}
                    >
                      {r.is_visible ? (
                        <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-stone-400" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && pagination.total > 0 && (
            <div className="p-4 border-t border-stone-100 dark:border-stone-800">
              <Pagination
                page={pagination.page}
                totalPages={pagination.total_pages}
                totalItems={pagination.total}
                pageSize={pagination.limit}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Review Details & Moderation Modal */}
      <ReviewDetailsModal
        isOpen={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        review={selectedReview}
      />
    </AdminLayout>
  );
}
