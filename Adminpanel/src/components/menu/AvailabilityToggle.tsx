"use client";

import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { menuService } from "@/services/menu";
import { useToast } from "@/components/common/Toast";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface AvailabilityToggleProps {
  itemId: number;
  itemName: string;
  isAvailable: boolean;
  size?: "sm" | "md";
}

export function AvailabilityToggle({
  itemId,
  itemName,
  isAvailable,
  size = "md",
}: AvailabilityToggleProps) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const mutation = useMutation({
    mutationFn: (newVal: boolean) => menuService.updateAvailability(itemId, newVal),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      const statusText = data.is_available ? "IN STOCK" : "OUT OF STOCK";
      success(`"${itemName}" is now marked as ${statusText}.`);
    },
    onError: () => {
      error("Failed to update availability status.");
    },
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mutation.isPending) return;
    mutation.mutate(!isAvailable);
  };

  const isSmall = size === "sm";

  return (
    <div className="inline-flex items-center gap-2 select-none" onClick={(e) => e.stopPropagation()}>
      {/* Visual Toggle Switch Button */}
      <button
        type="button"
        role="switch"
        aria-checked={isAvailable}
        onClick={handleToggle}
        disabled={mutation.isPending}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-700 dark:focus:ring-emerald-500 focus:ring-offset-1 dark:focus:ring-offset-stone-900 disabled:opacity-50 disabled:cursor-wait",
          isSmall ? "h-5 w-9" : "h-6 w-11",
          isAvailable
            ? "bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700"
            : "bg-stone-300 dark:bg-stone-700 hover:bg-stone-400 dark:hover:bg-stone-600"
        )}
        title={`Click to mark ${isAvailable ? "OUT OF STOCK" : "IN STOCK"}`}
      >
        <span
          className={cn(
            "pointer-events-none inline-flex items-center justify-center rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
            isSmall ? "h-4 w-4" : "h-5 w-5",
            isAvailable
              ? isSmall ? "translate-x-4" : "translate-x-5"
              : "translate-x-0"
          )}
        >
          {mutation.isPending ? (
            <Loader2 className={cn("animate-spin text-stone-500", isSmall ? "w-2.5 h-2.5" : "w-3 h-3")} />
          ) : null}
        </span>
      </button>

      {/* Status Label */}
      <span
        onClick={handleToggle}
        className={cn(
          "font-semibold cursor-pointer transition-colors",
          isSmall ? "text-[11px]" : "text-xs",
          isAvailable
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-stone-500 dark:text-stone-400"
        )}
      >
        {isAvailable ? "In Stock" : "Out of Stock"}
      </span>
    </div>
  );
}
