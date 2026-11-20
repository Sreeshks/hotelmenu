"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  MessageCircle,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  MapPin,
  User,
  FileText,
} from "lucide-react";
import { useCart } from "./CartContext";
import { resolveImageUrl, formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const {
    cart,
    totalItems,
    totalAmount,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    config,
  } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [orderSent, setOrderSent] = useState(false);

  // Sync initial table / location from config if not yet typed
  React.useEffect(() => {
    if (!tableNumber && (config.tableNumber || config.locationName)) {
      setTableNumber(config.tableNumber || config.locationName || "");
    }
  }, [config.tableNumber, config.locationName, tableNumber]);

  if (!isCartOpen) return null;

  const currency = config.currency || "OMR ";
  const restaurantName = config.restaurantName || "Koottu Curry Restaurant";
  const whatsappNumber = config.whatsappNumber || "+968 9111 0588";

  // Clean WhatsApp number to pure numeric string for wa.me API
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, "");

  const handleCheckoutWhatsApp = () => {
    if (cart.length === 0) return;

    const locationText = tableNumber.trim() ? tableNumber.trim() : (config.locationName || "Dine-In");

    let message = `*🍽️ NEW ORDER - ${restaurantName}*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📍 *Table / Location:* ${locationText}\n`;
    if (customerName.trim()) {
      message += `👤 *Customer:* ${customerName.trim()}\n`;
    }
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `*Items Ordered (${totalItems}):*\n`;

    cart.forEach((ci) => {
      const itemTotal = formatPrice(ci.item.price * ci.quantity, currency);
      message += `• *${ci.quantity}x* ${ci.item.name} - ${itemTotal}\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `*💰 Total Amount:* *${formatPrice(totalAmount, currency)}*\n`;

    if (specialNotes.trim()) {
      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `📝 *Special Instructions:* ${specialNotes.trim()}\n`;
    }

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `_Order submitted via Digital Menu_`;

    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;

    // Open WhatsApp
    window.open(whatsappUrl, "_blank");

    setOrderSent(true);
    setTimeout(() => {
      setOrderSent(false);
      clearCart();
      setIsCartOpen(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="fixed inset-0 bg-brand-950/70 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden">
        {/* Drawer Header */}
        <div className="px-5 py-4 bg-brand-950 text-white flex items-center justify-between border-b border-brand-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gold-500/20 text-gold-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-white flex items-center gap-2">
                <span>Your Food Order</span>
                {totalItems > 0 && (
                  <span className="text-[10px] font-sans font-bold bg-gold-500 text-brand-950 px-2 py-0.5 rounded-full">
                    {totalItems} items
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-stone-300">
                Checkout via WhatsApp
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
              <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-950">
                Your cart is empty
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-xs leading-relaxed">
                Explore our delicious menu items and click &quot;+ Add&quot; to begin your order.
              </p>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-brand-900 text-white text-xs font-bold hover:bg-brand-950 transition-colors shadow-sm"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-stone-100">
              {cart.map((ci) => (
                <div key={ci.item.id} className="pt-3 first:pt-0 flex items-center gap-3">
                  {/* Item Image */}
                  <div className="relative w-16 h-16 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                    {ci.item.image_url ? (
                      <Image
                        src={resolveImageUrl(ci.item.image_url)}
                        alt={ci.item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400 font-serif text-[10px]">
                        Dish
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-brand-950 truncate">
                      {ci.item.name}
                    </h4>
                    <p className="text-xs text-stone-500 font-serif mt-0.5">
                      {formatPrice(ci.item.price, currency)}
                    </p>
                    <p className="text-[11px] font-bold text-gold-600 mt-0.5">
                      Total: {formatPrice(ci.item.price * ci.quantity, currency)}
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 bg-stone-100 px-2 py-1 rounded-xl border border-stone-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(ci.item.id, -1)}
                      className="w-6 h-6 rounded-lg bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-bold transition-colors shadow-2xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-brand-950">
                      {ci.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(ci.item.id, 1)}
                      className="w-6 h-6 rounded-lg bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-bold transition-colors shadow-2xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(ci.item.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors shrink-0"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Order Info Form: Table / Location & Special Instructions */}
              <div className="pt-4 space-y-3">
                <h4 className="text-xs font-bold text-brand-950 uppercase tracking-wider">
                  Dining & Guest Details
                </h4>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gold-600" />
                      Table / Room
                    </label>
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder="e.g. Table 4"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-600 text-stone-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1 flex items-center gap-1">
                      <User className="w-3 h-3 text-gold-600" />
                      Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-600 text-stone-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-gold-600" />
                    Cooking Notes / Dietary Requests
                  </label>
                  <input
                    type="text"
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="e.g. Medium spicy, no onions, extra sauce"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-600 text-stone-800"
                  />
                </div>
              </div>
            </div>

            {/* Drawer Footer Checkout Button */}
            <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 space-y-3 shrink-0">
              {/* Subtotal row */}
              <div className="flex items-center justify-between text-xs text-stone-600">
                <span>Total Items:</span>
                <span className="font-semibold text-stone-900">{totalItems} items</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-serif text-base font-bold text-brand-950">
                  Total Amount:
                </span>
                <span className="font-serif text-2xl font-bold text-brand-950">
                  {formatPrice(totalAmount, currency)}
                </span>
              </div>

              {/* Order via WhatsApp Button */}
              <button
                type="button"
                onClick={handleCheckoutWhatsApp}
                disabled={orderSent}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2.5 disabled:opacity-75"
              >
                {orderSent ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>Opening WhatsApp...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
                    <span>Send Order via WhatsApp</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[10px] text-stone-400">
                  WhatsApp: {whatsappNumber}
                </p>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[11px] text-rose-600 hover:underline font-semibold"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
