"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { settingsApiService } from "@/services/settings";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemePresetInfo {
  id: string;
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
}

export const THEME_PRESETS: ThemePresetInfo[] = [
  {
    id: "maroon",
    name: "Royal Maroon (Default)",
    description: "Deep burgundy, warm maroon & royal gold accents",
    primary: "#800020",
    secondary: "#D4AF37",
    accent: "#5B0618",
  },
  {
    id: "emerald",
    name: "Emerald Forest",
    description: "Deep heritage pine green with warm amber",
    primary: "#064E3B",
    secondary: "#F59E0B",
    accent: "#042F2E",
  },
  {
    id: "navy",
    name: "Royal Navy & Sapphire",
    description: "Midnight sapphire blue with champagne accents",
    primary: "#1E3A8A",
    secondary: "#EAB308",
    accent: "#172554",
  },
  {
    id: "terracotta",
    name: "Warm Terracotta / Spice",
    description: "Rich rustic clay terracotta & warm saffron",
    primary: "#9A3412",
    secondary: "#F97316",
    accent: "#7C2D12",
  },
  {
    id: "obsidian",
    name: "Midnight Obsidian",
    description: "Sleek modern dark luxury with platinum accents",
    primary: "#18181B",
    secondary: "#D4D4D8",
    accent: "#09090B",
  },
  {
    id: "plum",
    name: "Imperial Plum Velvet",
    description: "Regal amethyst purple with rose gold",
    primary: "#581C87",
    secondary: "#EC4899",
    accent: "#3B0764",
  },
  {
    id: "custom",
    name: "Custom Brand Theme",
    description: "Choose your own personalized hex brand colors",
    primary: "#800020",
    secondary: "#D4AF37",
    accent: "#5B0618",
  },
];

interface SettingsContextValue {
  currencySymbol: string;
  setCurrencySymbol: (symbol: string) => void;
  restaurantName: string;
  setRestaurantName: (name: string) => void;
  tagline: string;
  setTagline: (tagline: string) => void;
  diningHours: string;
  setDiningHours: (hours: string) => void;
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  // Customer Menu Theme Settings
  frontendThemePreset: string;
  setFrontendThemePreset: (preset: string) => void;
  frontendPrimaryColor: string;
  setFrontendPrimaryColor: (color: string) => void;
  frontendSecondaryColor: string;
  setFrontendSecondaryColor: (color: string) => void;
  frontendAccentColor: string;
  setFrontendAccentColor: (color: string) => void;
  saveFrontendTheme: (preset: string, primary: string, secondary: string, accent?: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const STORAGE_KEY = "hotel_admin_settings";
const THEME_KEY = "hotel_admin_theme";

interface StoredSettings {
  currencySymbol?: string;
  restaurantName?: string;
  tagline?: string;
  diningHours?: string;
  logoUrl?: string | null;
  theme?: ThemeMode;
  frontendThemePreset?: string;
  frontendPrimaryColor?: string;
  frontendSecondaryColor?: string;
  frontendAccentColor?: string;
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
  const [currencySymbol, setCurrencySymbolState] = useState("OMR ");
  const [restaurantName, setRestaurantNameState] = useState("Koottu Curry Restaurant");
  const [tagline, setTaglineState] = useState("Authentic Kerala, Malabar & Arabic Cuisine");
  const [diningHours, setDiningHoursState] = useState("Daily 06:00 AM – 12:00 AM");
  const [logoUrl, setLogoUrlState] = useState<string | null>(null);
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Customer frontend theme state (Default: Maroon)
  const [frontendThemePreset, setFrontendThemePresetState] = useState("maroon");
  const [frontendPrimaryColor, setFrontendPrimaryColorState] = useState("#800020");
  const [frontendSecondaryColor, setFrontendSecondaryColorState] = useState("#D4AF37");
  const [frontendAccentColor, setFrontendAccentColorState] = useState("#5B0618");

  // Apply admin theme to document root
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

  // Load from localStorage on mount & sync with server settings
  useEffect(() => {
    const stored = loadSettings();
    if (stored.currencySymbol) setCurrencySymbolState(stored.currencySymbol);
    if (stored.restaurantName) setRestaurantNameState(stored.restaurantName);
    if (stored.tagline) setTaglineState(stored.tagline);
    if (stored.diningHours) setDiningHoursState(stored.diningHours);
    if (stored.logoUrl !== undefined) setLogoUrlState(stored.logoUrl);
    if (stored.frontendThemePreset) setFrontendThemePresetState(stored.frontendThemePreset);
    if (stored.frontendPrimaryColor) setFrontendPrimaryColorState(stored.frontendPrimaryColor);
    if (stored.frontendSecondaryColor) setFrontendSecondaryColorState(stored.frontendSecondaryColor);
    if (stored.frontendAccentColor) setFrontendAccentColorState(stored.frontendAccentColor);

    if (stored.theme) {
      setThemeState(stored.theme);
      applyTheme(stored.theme);
    } else {
      applyTheme("light");
    }

    // Sync from server settings
    settingsApiService
      .getSettings()
      .then((serverSettings) => {
        if (serverSettings.currency) {
          setCurrencySymbolState(serverSettings.currency);
          stored.currencySymbol = serverSettings.currency;
        }
        if (serverSettings.restaurant_name) {
          setRestaurantNameState(serverSettings.restaurant_name);
          stored.restaurantName = serverSettings.restaurant_name;
        }
        if (serverSettings.tagline) {
          setTaglineState(serverSettings.tagline);
          stored.tagline = serverSettings.tagline;
        }
        if (serverSettings.dining_hours) {
          setDiningHoursState(serverSettings.dining_hours);
          stored.diningHours = serverSettings.dining_hours;
        }
        if (serverSettings.logo_url !== undefined) {
          setLogoUrlState(serverSettings.logo_url);
          stored.logoUrl = serverSettings.logo_url;
        }
        if (serverSettings.theme_preset) {
          setFrontendThemePresetState(serverSettings.theme_preset);
          stored.frontendThemePreset = serverSettings.theme_preset;
        }
        if (serverSettings.primary_color) {
          setFrontendPrimaryColorState(serverSettings.primary_color);
          stored.frontendPrimaryColor = serverSettings.primary_color;
        }
        if (serverSettings.secondary_color) {
          setFrontendSecondaryColorState(serverSettings.secondary_color);
          stored.frontendSecondaryColor = serverSettings.secondary_color;
        }
        if (serverSettings.accent_color) {
          setFrontendAccentColorState(serverSettings.accent_color);
          stored.frontendAccentColor = serverSettings.accent_color;
        }
        saveSettings(stored);
      })
      .catch(() => {
        // Fallback to local storage if offline
      });

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
    settingsApiService.updateSettings({ currency: symbol }).catch(() => {});
  };

  const setRestaurantName = (name: string) => {
    setRestaurantNameState(name);
    const stored = loadSettings();
    saveSettings({ ...stored, restaurantName: name });
    settingsApiService.updateSettings({ restaurant_name: name }).catch(() => {});
  };

  const setTagline = (t: string) => {
    setTaglineState(t);
    const stored = loadSettings();
    saveSettings({ ...stored, tagline: t });
    settingsApiService.updateSettings({ tagline: t }).catch(() => {});
  };

  const setDiningHours = (hours: string) => {
    setDiningHoursState(hours);
    const stored = loadSettings();
    saveSettings({ ...stored, diningHours: hours });
    settingsApiService.updateSettings({ dining_hours: hours }).catch(() => {});
  };

  const setLogoUrl = (url: string | null) => {
    setLogoUrlState(url);
    const stored = loadSettings();
    saveSettings({ ...stored, logoUrl: url });
    settingsApiService.updateSettings({ logo_url: url }).catch(() => {});
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

  const setFrontendThemePreset = (preset: string) => {
    setFrontendThemePresetState(preset);
    const found = THEME_PRESETS.find((p) => p.id === preset);
    if (found && preset !== "custom") {
      setFrontendPrimaryColorState(found.primary);
      setFrontendSecondaryColorState(found.secondary);
      setFrontendAccentColorState(found.accent);
    }
  };

  const setFrontendPrimaryColor = (color: string) => {
    setFrontendPrimaryColorState(color);
  };

  const setFrontendSecondaryColor = (color: string) => {
    setFrontendSecondaryColorState(color);
  };

  const setFrontendAccentColor = (color: string) => {
    setFrontendAccentColorState(color);
  };

  const saveFrontendTheme = async (preset: string, primary: string, secondary: string, accent?: string) => {
    setFrontendThemePresetState(preset);
    setFrontendPrimaryColorState(primary);
    setFrontendSecondaryColorState(secondary);
    if (accent) setFrontendAccentColorState(accent);

    const stored = loadSettings();
    saveSettings({
      ...stored,
      frontendThemePreset: preset,
      frontendPrimaryColor: primary,
      frontendSecondaryColor: secondary,
      frontendAccentColor: accent || primary,
    });

    await settingsApiService.updateSettings({
      theme_preset: preset,
      primary_color: primary,
      secondary_color: secondary,
      accent_color: accent || primary,
    });
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
        logoUrl,
        setLogoUrl,
        theme,
        setTheme,
        isDarkMode,
        toggleTheme,
        frontendThemePreset,
        setFrontendThemePreset,
        frontendPrimaryColor,
        setFrontendPrimaryColor,
        frontendSecondaryColor,
        setFrontendSecondaryColor,
        frontendAccentColor,
        setFrontendAccentColor,
        saveFrontendTheme,
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
