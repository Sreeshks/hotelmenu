"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MenuItem } from "@/types";
import { AvailabilityToggle } from "./AvailabilityToggle";
import { formatPrice, resolveImageUrl } from "@/lib/utils";
import { Star, Edit2, Trash2, UtensilsCrossed, Sparkles } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { menuService } from "@/services/menu";
import { useToast } from "@/components/common/Toast";
import { useSettings } from "@/components/providers/SettingsProvider";

interface MenuTableProps {
  items: MenuItem[];
  isLoading?: boolean;
  onToggleAvailability?: (id: number, currentStatus: boolean) => void;
  onDeleteItem?: (item: MenuItem) => void;
}

export function MenuTable({
  items,
  isLoading = false,
  onToggleAvailability,
  onDeleteItem,
}: MenuTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { currencySymbol } = useSettings();

  const handleDeleteClick = (item: MenuItem) => {
    if (onDeleteItem) {
      onDeleteItem(item);
    } else {
      setDeleteTarget(item);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => menuService.deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      success(`"${deleteTarget?.name}" deleted successfully.`);
      setDeleteTarget(null);
    },
    onError: () => {
      error("Failed to delete menu item.");
    },
  });

  return (
    <>
      <div className="bg-white rounded-2xl border border-stone-200 shadow-card overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200/80 text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Item Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Price</th>
                <th className="py-3.5 px-4 text-center">Rating</th>
                <th className="py-3.5 px-4 text-center">Stock State</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-stone-50/70 transition-colors ${
                    !item.is_available ? "bg-amber-50/20" : ""
                  }`}
                >
                  {/* Item Image & Title */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveImageUrl(item.image_url)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UtensilsCrossed className="w-5 h-5 text-stone-400" />
                        )}
                      </div>

                      <div className="min-w-0 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-stone-900 truncate">{item.name}</span>
                          {item.is_bestseller && (
                            <span className="text-[10px] bg-gold-100 text-gold-800 font-bold px-1.5 py-0.2 rounded font-mono">
                              BEST
                            </span>
                          )}
                          {item.is_featured && (
                            <Sparkles className="w-3 h-3 text-gold-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-stone-400 truncate mt-0.5">
                          {item.short_description || item.description || "No description provided"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-4 px-4 text-xs font-medium text-stone-600">
                    <span className="bg-stone-100 px-2.5 py-1 rounded-lg">
                      {item.category_name || "General"}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-4 px-4 text-right font-bold text-stone-900">
                    {formatPrice(item.price, currencySymbol)}
                  </td>

                  {/* Rating */}
                  <td className="py-4 px-4 text-center">
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-gold-700 bg-gold-50 px-2 py-0.5 rounded-lg border border-gold-200">
                      <Star className="w-3 h-3 fill-gold-500 text-gold-500" />
                      <span>{item.rating.toFixed(1)}</span>
                      <span className="text-stone-400 text-[10px]">({item.review_count})</span>
                    </div>
                  </td>

                  {/* Quick Availability Toggle */}
                  <td className="py-4 px-4 text-center">
                    <AvailabilityToggle
                      itemId={item.id}
                      itemName={item.name}
                      isAvailable={item.is_available}
                      size="sm"
                    />
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/menu/${item.id}/edit`}
                        className="p-1.5 text-stone-500 hover:text-brand-850 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Edit Item"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => handleDeleteClick(item)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="md:hidden divide-y divide-stone-100">
          {items.map((item) => (
            <div key={item.id} className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveImageUrl(item.image_url)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UtensilsCrossed className="w-6 h-6 text-stone-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-stone-900 truncate">{item.name}</h4>
                    <span className="font-bold text-stone-900">{formatPrice(item.price, currencySymbol)}</span>
                  </div>
                  <p className="text-xs text-stone-400 line-clamp-1 mt-0.5">
                    {item.short_description || item.category_name}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-medium">
                      {item.category_name}
                    </span>
                    <span className="flex items-center gap-0.5 text-xs text-gold-600 font-semibold">
                      <Star className="w-3 h-3 fill-gold-500 text-gold-500" />
                      {item.rating.toFixed(1)} ({item.review_count})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <AvailabilityToggle
                  itemId={item.id}
                  itemName={item.name}
                  isAvailable={item.is_available}
                  size="sm"
                />

                <div className="flex items-center gap-2">
                  <Link
                    href={`/menu/${item.id}/edit`}
                    className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(item)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Menu Item"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? It will no longer appear in the digital menu.`}
        confirmText="Delete Dish"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
