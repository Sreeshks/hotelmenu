"use client";

import React from "react";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "./CartContext";
import { formatPrice } from "@/lib/utils";

export function FloatingCartBar() {
  const { totalItems, totalAmount, setIsCartOpen, config } = useCart();

  // If online ordering is disabled or no items in cart, do not show floating bar
  if (!config.onlineOrderingEnabled || totalItems === 0) {
    return null;
  }

  const currency = config.currency || "OMR ";

  return (
    <div className="fixed bottom-20 sm:bottom-6 inset-x-4 sm:inset-x-auto sm:right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <button
        onClick={() => setIsCartOpen(true)}
        className="w-full sm:w-auto bg-brand-950 text-white pl-4 pr-5 py-3 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.3)] hover:shadow-2xl border border-gold-500/30 flex items-center justify-between sm:gap-6 hover:scale-[1.02] active:scale-[0.98] transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gold-500 text-brand-950 flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-1.5 bg-[#25D366] text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-brand-950 shadow-sm">
              {totalItems}
            </span>
          </div>
          <div className="text-left">
            <p className="text-[11px] text-stone-300 font-medium leading-none">
              {totalItems} {totalItems === 1 ? "item" : "items"} in cart
            </p>
            <p className="font-serif text-base font-bold text-white leading-tight mt-0.5">
              {formatPrice(totalAmount, currency)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-gold-400 group-hover:text-gold-300 transition-colors">
          <span>Checkout (WhatsApp)</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </button>
    </div>
  );
}
