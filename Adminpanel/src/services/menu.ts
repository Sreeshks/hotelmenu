import api from "@/lib/api";
import { MenuItem, MenuItemInput, ApiResponse, PaginatedResponse, ImageSearchResult } from "@/types";

export interface MenuFilterParams {
  category_id?: number | null;
  search?: string;
  is_available?: boolean;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export const menuService = {
  async getMenuItems(params: MenuFilterParams = {}): Promise<PaginatedResponse<MenuItem>> {
    const queryParams: Record<string, any> = {};
    if (params.category_id) queryParams.category_id = params.category_id;
    if (params.search) queryParams.search = params.search;
    if (params.is_available !== undefined) queryParams.is_available = params.is_available;
    if (params.is_active !== undefined) queryParams.is_active = params.is_active;
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;

    const response = await api.get<PaginatedResponse<MenuItem>>("/admin/menu-items", {
      params: queryParams,
    });
    return response.data;
  },

  async getMenuItem(id: number): Promise<MenuItem> {
    const response = await api.get<ApiResponse<MenuItem>>(`/admin/menu-items/${id}`);
    return response.data.data;
  },

  async createMenuItem(data: MenuItemInput): Promise<MenuItem> {
    const response = await api.post<ApiResponse<MenuItem>>("/admin/menu-items", data);
    return response.data.data;
  },

  async updateMenuItem(id: number, data: Partial<MenuItemInput>): Promise<MenuItem> {
    const response = await api.put<ApiResponse<MenuItem>>(`/admin/menu-items/${id}`, data);
    return response.data.data;
  },

  async updateAvailability(id: number, is_available: boolean): Promise<MenuItem> {
    const response = await api.patch<ApiResponse<MenuItem>>(
      `/admin/menu-items/${id}/availability`,
      { is_available }
    );
    return response.data.data;
  },

  async deleteMenuItem(id: number, hard: boolean = true): Promise<void> {
    await api.delete(`/admin/menu-items/${id}`, {
      params: { hard },
    });
  },

  async uploadImage(id: number, file: File): Promise<MenuItem> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<ApiResponse<MenuItem>>(
      `/admin/menu-items/${id}/image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  },

  async searchImages(query: string, limit: number = 24): Promise<ImageSearchResult[]> {
    const response = await api.get<ApiResponse<{ query: string; count: number; results: ImageSearchResult[] }>>(
      "/admin/menu-items/search-images",
      {
        params: { q: query, limit },
      }
    );
    return response.data.data.results;
  },

  async clearData(target: "all" | "products" | "categories" = "all"): Promise<{
    items_deleted: number;
    categories_deleted: number;
    reviews_deleted: number;
    target: string;
    message: string;
  }> {
    const response = await api.post<
      ApiResponse<{
        items_deleted: number;
        categories_deleted: number;
        reviews_deleted: number;
        target: string;
        message: string;
      }>
    >("/admin/clear-data", { target });
    return response.data.data;
  },
};


