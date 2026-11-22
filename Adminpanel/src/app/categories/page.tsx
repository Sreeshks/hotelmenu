"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Folder,
  Edit2,
  Trash2,
  RefreshCw,
  Utensils,
  CheckCircle2,
  XCircle,
  ImageIcon,
  Gift,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Move,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { CategoryFormModal } from "@/components/categories/CategoryFormModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ClearDataModal } from "@/components/common/ClearDataModal";
import { EmptyState } from "@/components/common/EmptyState";
import { categoryService } from "@/services/categories";

import { useToast } from "@/components/common/Toast";
import { Category } from "@/types";
import { resolveImageUrl } from "@/lib/utils";

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const {
    data: categories = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getCategories(),
  });

  // Keep local categoriesList in sync with fetched query data
  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoriesList(
        [...categories].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      );
    } else {
      setCategoriesList([]);
    }
  }, [categories]);

  // Persist new category order to the backend API
  const reorderMutation = useMutation({
    mutationFn: (newOrder: Category[]) => {
      const items = newOrder.map((cat, idx) => ({
        id: cat.id,
        display_order: idx + 1,
      }));
      return categoryService.reorder(items);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["customer-menu"] });
      addToast({
        type: "success",
        title: "Display Order Saved",
        message: "Categories reordered successfully. Main menu positions updated!",
      });
    },
    onError: () => {
      addToast({
        type: "error",
        title: "Reorder Failed",
        message: "Could not save the new category sequence.",
      });
      if (categories) {
        setCategoriesList(
          [...categories].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        );
      }
    },
  });

  // Drag and drop handlers
  const handleDragStart = (index: number, e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (targetIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...categoriesList];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setCategoriesList(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);

    reorderMutation.mutate(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Move Up / Move Down buttons for mobile and click-based reordering
  const handleMove = (index: number, direction: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categoriesList.length) return;

    const updated = [...categoriesList];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, movedItem);

    setCategoriesList(updated);
    reorderMutation.mutate(updated);
  };

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      categoryService.setStatus(id, is_active),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      addToast({
        type: "success",
        title: updated.is_active ? "Category Activated" : "Category Deactivated",
        message: `"${updated.name}" is now ${updated.is_active ? "visible" : "hidden"} to diners.`,
      });
    },
    onError: () => {
      addToast({
        type: "error",
        title: "Action Failed",
        message: "Unable to update category status.",
      });
    },
  });

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await categoryService.deleteCategory(categoryToDelete.id);
      addToast({
        type: "success",
        title: "Category Removed",
        message: `"${categoryToDelete.name}" has been deleted.`,
      });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["customer-menu"] });
      setCategoryToDelete(null);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Could not delete category.";
      addToast({
        type: "error",
        title: "Deletion Failed",
        message: typeof msg === "string" ? msg : JSON.stringify(msg),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl lg:text-3xl font-bold text-brand-950 dark:text-stone-100">
              Menu Categories
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Organize your courses, wine lists, and culinary sections.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-brand-950 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors shadow-sm disabled:opacity-50"
              title="Refresh Categories"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-stone-850 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold text-sm transition-colors shadow-sm"
              title="Clear all categories and dishes"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Categories</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-950 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4 text-gold-400 dark:text-gold-300" />
              <span>Add Category</span>
            </button>

            <Link
              href="/menu/new?combo=true"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
              title="Create a new combo offer deal"
            >
              <Gift className="w-4 h-4 text-purple-200" />
              <span>Add Combo Deal</span>
            </Link>
          </div>

        </div>

        {/* Reorder Helper Banner */}
        {categoriesList.length > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl px-4 py-3 text-xs text-amber-900 dark:text-amber-200 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-200/70 dark:bg-amber-800/50 flex items-center justify-center shrink-0 text-amber-900 dark:text-amber-200">
                <Move className="w-4 h-4" />
              </div>
              <p>
                <strong className="font-semibold">Main Menu Display Order:</strong> Drag any category card or click <span className="font-mono bg-white/70 dark:bg-stone-800 px-1.5 py-0.5 rounded border border-amber-300/60 font-bold">↑ / ↓</span> to reorder. The customer menu updates automatically!
              </p>
            </div>
            {reorderMutation.isPending && (
              <span className="inline-flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 shrink-0 bg-white/80 dark:bg-stone-800/80 px-2.5 py-1 rounded-lg border border-amber-300/50">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Saving sequence...
              </span>
            )}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-white dark:bg-[#121815] rounded-2xl border border-stone-200 dark:border-stone-800 animate-pulse" />
            ))}
          </div>
        ) : categoriesList.length === 0 ? (
          <div className="bg-white dark:bg-[#121815] rounded-2xl border border-stone-200 dark:border-stone-800 p-8 shadow-sm">
            <EmptyState
              title="No Categories Configured"
              description="Create your first culinary category to start grouping dishes (e.g. Starters, Main Courses, Cellar Selection)."
              action={{
                label: "Create Category",
                onClick: handleOpenCreate,
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoriesList.map((cat, index) => {
              const isBeingDragged = draggedIndex === index;
              const isOver = dragOverIndex === index && draggedIndex !== index;

              return (
                <div
                  key={cat.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(index, e)}
                  onDragOver={(e) => handleDragOver(index, e)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(index, e)}
                  className={`bg-white dark:bg-[#121815] rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between group cursor-grab active:cursor-grabbing select-none ${
                    isBeingDragged
                      ? "opacity-35 scale-[0.98] ring-2 ring-gold-400 border-gold-400 shadow-2xl"
                      : isOver
                      ? "ring-2 ring-brand-700 dark:ring-emerald-500 scale-[1.02] border-brand-700 bg-brand-50/20 shadow-xl"
                      : "border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-md"
                  }`}
                >
                  <div>
                    {/* Category Image Header */}
                    <div className="relative h-32 w-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                      {cat.image ? (
                        <Image
                          src={resolveImageUrl(cat.image)}
                          alt={cat.name}
                          fill
                          className="object-cover pointer-events-none"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 dark:text-stone-500 bg-stone-100/70 dark:bg-stone-800/70">
                          <ImageIcon className="w-8 h-8 stroke-[1.5]" />
                          <span className="text-[11px] font-medium mt-1 uppercase tracking-wider">
                            No Header Photo
                          </span>
                        </div>
                      )}

                      {/* Drag Handle & Order Badge Overlay (Top Left) */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                        <div
                          className="px-2 py-1 rounded-lg bg-brand-950/85 backdrop-blur-md text-gold-300 border border-gold-400/30 flex items-center gap-1 shadow-sm"
                          title="Drag to change display order in main menu"
                        >
                          <GripVertical className="w-3.5 h-3.5 text-gold-400" />
                          <span className="text-xs font-mono font-bold tracking-tight">#{index + 1}</span>
                        </div>

                        {/* Move Up / Down Buttons for quick click reordering */}
                        <div className="flex items-center bg-brand-950/85 backdrop-blur-md rounded-lg border border-white/10 p-0.5 shadow-sm">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={(e) => handleMove(index, "up", e)}
                            className="p-1 text-stone-300 hover:text-white hover:bg-white/20 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            title="Move Up in Main Menu"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === categoriesList.length - 1}
                            onClick={(e) => handleMove(index, "down", e)}
                            className="p-1 text-stone-300 hover:text-white hover:bg-white/20 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            title="Move Down in Main Menu"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Badge Overlay (Top Right) */}
                      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-brand-950/80 backdrop-blur-md text-gold-300 font-semibold shadow-sm flex items-center gap-1">
                          <Utensils className="w-3 h-3 text-gold-400" />
                          {cat.item_count ?? 0} dishes
                        </span>
                      </div>
                    </div>

                    {/* Body Info */}
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-serif text-lg font-bold text-brand-950 dark:text-stone-100 truncate">
                          {cat.name}
                        </h3>
                        <span className="text-xs font-mono text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700 font-medium">
                          Position #{index + 1}
                        </span>
                      </div>

                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 min-h-[32px]">
                        {cat.description || "No description provided for this culinary group."}
                      </p>
                    </div>
                  </div>

                  {/* Footer Toolbar */}
                  <div className="px-5 py-3.5 bg-stone-50/70 dark:bg-stone-900/60 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    {/* Status Toggle */}
                    <button
                      onClick={() =>
                        toggleStatusMutation.mutate({
                          id: cat.id,
                          is_active: !cat.is_active,
                        })
                      }
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                        cat.is_active
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                          : "bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-300 dark:hover:bg-stone-700"
                      }`}
                    >
                      {cat.is_active ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-stone-500" />
                          Hidden
                        </>
                      )}
                    </button>

                    {/* Edit, Combo and Delete Buttons */}
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/menu/new?category_id=${cat.id}&combo=true`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg border border-purple-200/80 dark:border-purple-800/60 transition-colors"
                        title={`Create a combo meal package in ${cat.name}`}
                      >
                        <Gift className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        <span>+ Combo</span>
                      </Link>

                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 text-stone-600 dark:text-stone-400 hover:text-brand-900 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-stone-800 rounded-lg transition-colors"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCategoryToDelete(cat)}
                        className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Create/Edit Modal */}
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={selectedCategory}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Menu Category"
        message={`Are you sure you want to remove "${categoryToDelete?.name}"? Items linked to this category may lose their categorization.`}
        confirmText="Yes, Delete"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Clear Categories & Products Modal */}
      <ClearDataModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        defaultTarget="categories"
      />
    </AdminLayout>
  );
}

