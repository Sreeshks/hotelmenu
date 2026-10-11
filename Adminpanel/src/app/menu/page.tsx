"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Utensils, RefreshCw, AlertCircle, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { MenuFilters } from "@/components/menu/MenuFilters";
import { MenuTable } from "@/components/menu/MenuTable";
import { Pagination } from "@/components/common/Pagination";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ClearDataModal } from "@/components/common/ClearDataModal";
import { menuService, MenuFilterParams } from "@/services/menu";

import { categoryService } from "@/services/categories";
import { useToast } from "@/components/common/Toast";
import { MenuItem } from "@/types";

export default function MenuManagementPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [search, setSearch] = useState<string>("");
  const [isAvailable, setIsAvailable] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  // State for delete confirmation
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);


  // Fetch categories for filtering dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getCategories(),
  });

  // Query menu items with current filters and pagination
  const filterParams: MenuFilterParams = {
    category_id: categoryId,
    search: search.trim() || undefined,
    is_available: isAvailable,
    page,
    limit,
  };

  const {
    data: menuData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["menu-items", filterParams],
    queryFn: () => menuService.getMenuItems(filterParams),
  });

  const items = menuData?.data || [];
  const pagination = menuData?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1,
  };

  // Quick availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, is_available }: { id: number; is_available: boolean }) =>
      menuService.updateAvailability(id, is_available),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      addToast({
        type: "success",
        title: updated.is_available ? "Item In Stock" : "Item Marked Out of Stock",
        message: `"${updated.name}" status updated for customer menus.`,
      });
    },
    onError: () => {
      addToast({
        type: "error",
        title: "Update Failed",
        message: "Failed to update item availability.",
      });
    },
  });

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await menuService.deleteMenuItem(itemToDelete.id);
      addToast({
        type: "success",
        title: "Item Removed",
        message: `"${itemToDelete.name}" has been removed from the catalog.`,
      });
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setItemToDelete(null);
    } catch (err) {
      addToast({
        type: "error",
        title: "Deletion Failed",
        message: "Unable to delete the menu item.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl lg:text-3xl font-bold text-brand-950 dark:text-stone-100">
              Menu Catalog
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Curate signature recipes, manage prices, and control real-time inventory availability.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-brand-950 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors shadow-sm disabled:opacity-50"
              title="Refresh Items"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-stone-850 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold text-sm transition-colors shadow-sm"
              title="Clear all products from catalog"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Products</span>
            </button>

            <Link
              href="/menu/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-950 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4 text-gold-400 dark:text-gold-300" />
              <span>Create New Dish</span>
            </Link>
          </div>

        </div>

        {/* Filter Toolbar */}
        <MenuFilters
          categories={categories}
          selectedCategory={categoryId}
          searchQuery={search}
          availableFilter={isAvailable}
          onCategoryChange={(val) => {
            setCategoryId(val);
            setPage(1);
          }}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          onAvailableChange={(val) => {
            setIsAvailable(val);
            setPage(1);
          }}
          onReset={() => {
            setCategoryId(null);
            setSearch("");
            setIsAvailable(undefined);
            setPage(1);
          }}
        />

        {/* Menu Items Table */}
        <div className="bg-white dark:bg-[#121815] rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden">
          <MenuTable
            items={items}
            isLoading={isLoading}
            onToggleAvailability={(id, currentStatus) =>
              toggleAvailabilityMutation.mutate({ id, is_available: !currentStatus })
            }
            onDeleteItem={(item) => setItemToDelete(item)}
          />

          {/* Pagination Controls */}
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

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteItem}
        title="Remove Menu Item"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? It will no longer appear on guest digital menus.`}
        confirmText="Yes, Remove"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Clear Products Modal */}
      <ClearDataModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        defaultTarget="products"
      />
    </AdminLayout>
  );
}

