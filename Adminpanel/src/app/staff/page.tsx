"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Star,
  Users,
  Edit2,
  Trash2,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Award,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StaffFormModal } from "@/components/staff/StaffFormModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { staffService } from "@/services/staff";
import { useToast } from "@/components/common/Toast";
import { Staff } from "@/types";
import { resolveImageUrl } from "@/lib/utils";

export default function StaffPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: staffList = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["staff"],
    queryFn: () => staffService.getStaffList(),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      staffService.updateStaff(id, { is_active }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      addToast({
        type: "success",
        title: updated.is_active ? "Staff Active" : "Staff Deactivated",
        message: `${updated.name}'s service status updated.`,
      });
    },
    onError: () => {
      addToast({
        type: "error",
        title: "Action Failed",
        message: "Failed to update staff status.",
      });
    },
  });

  const handleDelete = async () => {
    if (!staffToDelete) return;
    setIsDeleting(true);
    try {
      await staffService.deleteStaff(staffToDelete.id);
      addToast({
        type: "success",
        title: "Staff Member Removed",
        message: `${staffToDelete.name} has been removed.`,
      });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setStaffToDelete(null);
    } catch (err) {
      addToast({
        type: "error",
        title: "Deletion Failed",
        message: "Could not remove this staff member.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedStaff(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl lg:text-3xl font-bold text-brand-950 dark:text-stone-100">
              Hospitality & Service Staff
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Manage dining room servers, sommeliers, and track guest service performance ratings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-brand-950 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors shadow-sm disabled:opacity-50"
              title="Refresh Staff"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-950 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4 text-gold-400 dark:text-gold-300" />
              <span>Add Staff Member</span>
            </button>
          </div>
        </div>

        {/* Staff Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-56 bg-white dark:bg-[#121815] rounded-3xl border border-stone-200 dark:border-stone-800 animate-pulse" />
            ))}
          </div>
        ) : staffList.length === 0 ? (
          <div className="bg-white dark:bg-[#121815] rounded-3xl border border-stone-200 dark:border-stone-800 p-8 shadow-sm">
            <EmptyState
              title="No Staff Members Found"
              description="Register dining room staff to enable guests to leave direct service compliments and ratings."
              action={{
                label: "Add First Staff Member",
                onClick: handleOpenCreate,
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staffList.map((member) => (
              <div
                key={member.id}
                className="bg-white dark:bg-[#121815] rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar Portrait */}
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-brand-900 text-gold-300 flex items-center justify-center font-serif text-xl font-bold flex-shrink-0 shadow-md">
                      {member.profile_image ? (
                        <Image
                          src={resolveImageUrl(member.profile_image)}
                          alt={member.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span>
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                      )}
                    </div>

                    {/* Information */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono uppercase bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded border border-transparent dark:border-stone-700/60">
                          {member.employee_code}
                        </span>
                      </div>
                      <h3 className="font-serif text-lg font-bold text-brand-950 dark:text-stone-100 truncate mt-1">
                        {member.name}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 font-medium truncate">
                        {member.designation}
                      </p>
                    </div>
                  </div>

                  {/* Rating Card */}
                  <div className="mt-5 p-3.5 bg-gold-50/60 dark:bg-gold-950/30 rounded-2xl border border-gold-200/60 dark:border-gold-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 fill-gold-500 text-gold-500" />
                      </div>
                      <span className="font-serif text-base font-bold text-gold-950 dark:text-gold-200">
                        {member.average_rating > 0
                          ? member.average_rating.toFixed(1)
                          : "New"}
                      </span>
                    </div>

                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      {member.total_ratings} {member.total_ratings === 1 ? "review" : "reviews"}
                    </span>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-3.5 bg-stone-50/80 dark:bg-stone-900/60 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  {/* Status Toggle */}
                  <button
                    onClick={() =>
                      toggleStatusMutation.mutate({
                        id: member.id,
                        is_active: !member.is_active,
                      })
                    }
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                      member.is_active
                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                        : "bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-300 dark:hover:bg-stone-700"
                    }`}
                  >
                    {member.is_active ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        On Duty
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-stone-500" />
                        Off Duty
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/staff/${member.id}`}
                      className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-brand-900 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-stone-800 rounded-lg transition-colors"
                      title="View Rating Breakdown"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleOpenEdit(member)}
                      className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-brand-900 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-stone-800 rounded-lg transition-colors"
                      title="Edit Staff Member"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setStaffToDelete(member)}
                      className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                      title="Delete Staff Member"
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

      {/* Staff Create/Edit Modal */}
      <StaffFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        staff={selectedStaff}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!staffToDelete}
        onClose={() => setStaffToDelete(null)}
        onConfirm={handleDelete}
        title="Remove Staff Member"
        message={`Are you sure you want to remove ${staffToDelete?.name} from active staff?`}
        confirmText="Yes, Remove"
        variant="danger"
        isLoading={isDeleting}
      />
    </AdminLayout>
  );
}
