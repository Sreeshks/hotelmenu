import api from "@/lib/api";
import { CustomerMenuResponse, MenuItem, MenuVersionResponse, ApiResponse, PaginatedResponse } from "@/types";

export interface SearchMenuParams {
  search?: string;
  q?: string;
  qr_token?: string;
  category_id?: number;
  is_available?: boolean;
  page?: number;
  limit?: number;
}

export const menuService = {
  async getMenuByToken(qr_token: string): Promise<CustomerMenuResponse> {
    const response = await api.get<CustomerMenuResponse>(`/menu/${qr_token}`);
    return response.data;
  },

  async getMenuVersion(qr_token: string): Promise<number> {
    const response = await api.get<MenuVersionResponse>(`/menu/${qr_token}/version`);
    return response.data.version;
  },

  async getMenuItem(id: number): Promise<MenuItem> {
    const response = await api.get<ApiResponse<MenuItem>>(`/menu-items/${id}`);
    return response.data.data;
  },

  async searchMenuItems(params: SearchMenuParams): Promise<MenuItem[]> {
    const queryParams = new URLSearchParams();
    const query = params.search || params.q || "";
    if (query) queryParams.set("search", query);
    if (params.category_id) queryParams.set("category_id", String(params.category_id));
    if (params.is_available !== undefined) queryParams.set("is_available", String(params.is_available));
    if (params.page) queryParams.set("page", String(params.page));
    if (params.limit) queryParams.set("limit", String(params.limit));

    const endpoint = params.qr_token
      ? `/menu/${params.qr_token}/search?${queryParams.toString()}`
      : `/menu/search?${queryParams.toString()}`;

    const response = await api.get<PaginatedResponse<MenuItem>>(endpoint);
    return response.data.data;
  },
};
