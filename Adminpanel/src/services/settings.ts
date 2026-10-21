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
  theme_preset?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
}

export interface DatabaseStats {
  counts: Record<string, number>;
  total_records: number;
  dialect: string;
  generated_at: string;
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

  async getDatabaseStats(): Promise<DatabaseStats> {
    const response = await api.get<ApiResponse<DatabaseStats>>("/admin/settings/backup/stats");
    return response.data.data;
  },

  async downloadSqlBackup(): Promise<void> {
    const response = await api.get("/admin/settings/backup/download", {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/sql" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const now = new Date().toISOString().slice(0, 10);
    link.download = `hotel_menu_database_backup_${now}.sql`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async downloadJsonBackup(): Promise<void> {
    const response = await api.get("/admin/settings/backup/download-json", {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const now = new Date().toISOString().slice(0, 10);
    link.download = `hotel_menu_database_export_${now}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
