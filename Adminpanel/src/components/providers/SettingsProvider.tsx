"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SettingsContextValue {
  currencySymbol: string;
  setCurrencySymbol: (symbol: string) => void;
  restaurantName: string;
  setRestaurantName: (name: string) => void;
  tagline: string;
  setTagline: (tagline: string) => void;
  diningHours: string;
  setDiningHours: (hours: string) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const STORAGE_KEY = "hotel_admin_settings";

interface StoredSettings {
  currencySymbol?: string;
  restaurantName?: string;
  tagline?: string;
  diningHours?: string;
}

function loadSettings(): StoredSettings {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSettings(settings: StoredSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [currencySymbol, setCurrencySymbolState] = useState("₹");
  const [restaurantName, setRestaurantNameState] = useState("Grand Hotel & Dining");
  const [tagline, setTaglineState] = useState(
    "Exquisite Culinary Traditions & Contemporary Gastronomy"
  );
  const [diningHours, setDiningHoursState] = useState(
    "Breakfast 07:00-10:30 | Lunch 12:00-15:00 | Dinner 18:30-23:00"
  );

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadSettings();
    if (stored.currencySymbol) setCurrencySymbolState(stored.currencySymbol);
    if (stored.restaurantName) setRestaurantNameState(stored.restaurantName);
    if (stored.tagline) setTaglineState(stored.tagline);
    if (stored.diningHours) setDiningHoursState(stored.diningHours);
  }, []);

  const setCurrencySymbol = (symbol: string) => {
    setCurrencySymbolState(symbol);
    const stored = loadSettings();
    saveSettings({ ...stored, currencySymbol: symbol });
  };

  const setRestaurantName = (name: string) => {
    setRestaurantNameState(name);
    const stored = loadSettings();
    saveSettings({ ...stored, restaurantName: name });
  };

  const setTagline = (t: string) => {
    setTaglineState(t);
    const stored = loadSettings();
    saveSettings({ ...stored, tagline: t });
  };

  const setDiningHours = (hours: string) => {
    setDiningHoursState(hours);
    const stored = loadSettings();
    saveSettings({ ...stored, diningHours: hours });
  };

  return (
    <SettingsContext.Provider
      value={{
        currencySymbol,
        setCurrencySymbol,
        restaurantName,
        setRestaurantName,
        tagline,
        setTagline,
        diningHours,
        setDiningHours,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}
