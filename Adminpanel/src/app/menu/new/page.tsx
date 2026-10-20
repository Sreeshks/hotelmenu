"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { MenuForm } from "@/components/menu/MenuForm";

function NewMenuItemContent() {
  const searchParams = useSearchParams();
  const categoryIdParam = searchParams.get("category_id");
  const isComboParam = searchParams.get("combo") === "true";

  return (
    <MenuForm
      isEdit={false}
      defaultCategoryId={categoryIdParam ? Number(categoryIdParam) : undefined}
      defaultIsCombo={isComboParam}
    />
  );
}

export default function NewMenuItemPage() {
  return (
    <AdminLayout>
      <div className="py-2">
        <Suspense fallback={<div className="h-48 rounded-2xl bg-white dark:bg-[#121815] animate-pulse" />}>
          <NewMenuItemContent />
        </Suspense>
      </div>
    </AdminLayout>
  );
}
