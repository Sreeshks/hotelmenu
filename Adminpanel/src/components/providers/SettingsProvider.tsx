"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";

interface SettingsContextValue {
  currencySymbol: string;
  setCurrencySymbol: (symbol: string) => void;
  restaurantName: string;
  setRestaurantName: (name: string) => void;
  tagline: string;
  setTagline: (tagline: string) => void;
  diningHours: string;
  setDiningHours: (hours: string) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const STORAGE_KEY = "hotel_admin_settings";
const THEME_KEY = "hotel_admin_theme";

interface StoredSettings {
  currencySymbol?: string;
  restaurantName?: string;
  tagline?: string;
  diningHours?: string;
  theme?: ThemeMode;
}

function loadSettings(): StoredSettings {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const standaloneTheme = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    if (standaloneTheme) {
      parsed.theme = standaloneTheme;
    }
    return parsed;
  } catch {
    return {};
  }
}

function saveSettings(settings: StoredSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    if (settings.theme) {
      localStorage.setItem(THEME_KEY, settings.theme);
    }
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
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Apply theme to document root
  const applyTheme = useCallback((themeMode: ThemeMode) => {
    if (typeof window === "undefined") return;

    let shouldBeDark = false;
    if (themeMode === "dark") {
      shouldBeDark = true;
    } else if (themeMode === "system") {
      shouldBeDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
      shouldBeDark = false;
    }

    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadSettings();
    if (stored.currencySymbol) setCurrencySymbolState(stored.currencySymbol);
    if (stored.restaurantName) setRestaurantNameState(stored.restaurantName);
    if (stored.tagline) setTaglineState(stored.tagline);
    if (stored.diningHours) setDiningHoursState(stored.diningHours);
    if (stored.theme) {
      setThemeState(stored.theme);
      applyTheme(stored.theme);
    } else {
      applyTheme("light");
    }

    // Media query listener for system mode
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      const currentStored = loadSettings();
      if (currentStored.theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [applyTheme]);

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

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    const stored = loadSettings();
    saveSettings({ ...stored, theme: newTheme });
  };

  const toggleTheme = () => {
    const nextTheme: ThemeMode = isDarkMode ? "light" : "dark";
    setTheme(nextTheme);
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
        theme,
        setTheme,
        isDarkMode,
        toggleTheme,
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
