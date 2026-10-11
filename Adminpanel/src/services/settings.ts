import api from "@/lib/api";
import { ApiResponse } from "@/types";

export interface RestaurantSettings {
  restaurant_name: string;
  tagline: string;
  currency: string;
  dining_hours: string;
  phone?: string;
  address?: string;
  city?: string;
  wifi_ssid?: string;
  logo_url?: string | null;
}

export const settingsApiService = {
  async getSettings(): Promise<RestaurantSettings> {
    const response = await api.get<ApiResponse<RestaurantSettings>>("/settings");
    return response.data.data;
  },

  async updateSettings(data: Partial<RestaurantSettings>): Promise<RestaurantSettings> {
    const response = await api.put<ApiResponse<RestaurantSettings>>("/admin/settings", data);
    return response.data.data;
  },
};
