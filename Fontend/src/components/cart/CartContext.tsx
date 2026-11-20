"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { MenuItem } from "@/types";

export interface CartItem {
  item: MenuItem;
  quantity: number;
  notes?: string;
}

export interface RestaurantOrderConfig {
  whatsappNumber?: string | null;
  onlineOrderingEnabled?: boolean | null;
  restaurantName?: string | null;
  locationName?: string | null;
  currency?: string | null;
  tableNumber?: string | null;
  roomNumber?: string | null;
}

interface CartContextValue {
  cart: CartItem[];
  totalItems: number;
  totalAmount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (item: MenuItem, quantity?: number) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, delta: number) => void;
  getItemQuantity: (itemId: number) => number;
  clearCart: () => void;
  config: RestaurantOrderConfig;
  setConfig: (config: RestaurantOrderConfig) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_STORAGE_KEY = "hotel_customer_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [config, setConfigState] = useState<RestaurantOrderConfig>({
    whatsappNumber: "+968 9111 0588",
    onlineOrderingEnabled: true,
    restaurantName: "Koottu Curry Restaurant",
    currency: "OMR ",
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  const setConfig = (newConfig: RestaurantOrderConfig) => {
    setConfigState((prev) => ({
      ...prev,
      ...newConfig,
    }));
  };

  const addToCart = (item: MenuItem, quantity = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((ci) => ci.item.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      } else {
        return [...prevCart, { item, quantity }];
      }
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart((prevCart) => prevCart.filter((ci) => ci.item.id !== itemId));
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((ci) => {
          if (ci.item.id === itemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const getItemQuantity = (itemId: number) => {
    const found = cart.find((ci) => ci.item.id === itemId);
    return found ? found.quantity : 0;
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = useMemo(() => {
    return cart.reduce((sum, ci) => sum + ci.quantity, 0);
  }, [cart]);

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        totalItems,
        totalAmount,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        getItemQuantity,
        clearCart,
        config,
        setConfig,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
