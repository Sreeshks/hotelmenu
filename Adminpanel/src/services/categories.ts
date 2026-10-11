import api from "@/lib/api";
import { Category, CategoryInput, ApiResponse } from "@/types";

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const response = await api.get<ApiResponse<Category[]>>("/admin/categories");
    return response.data.data;
  },

  async getCategory(id: number): Promise<Category> {
    const response = await api.get<ApiResponse<Category>>(`/admin/categories/${id}`);
    return response.data.data;
  },

  async createCategory(data: CategoryInput): Promise<Category> {
    const response = await api.post<ApiResponse<Category>>("/admin/categories", data);
    return response.data.data;
  },

  async updateCategory(id: number, data: Partial<CategoryInput>): Promise<Category> {
    const response = await api.put<ApiResponse<Category>>(`/admin/categories/${id}`, data);
    return response.data.data;
  },

  async setStatus(id: number, is_active: boolean): Promise<Category> {
    const response = await api.patch<ApiResponse<Category>>(
      `/admin/categories/${id}/status`,
      { is_active }
    );
    return response.data.data;
  },

  async reorder(items: { id: number; display_order: number }[]): Promise<void> {
    await api.patch("/admin/categories/reorder", items);
  },

  async deleteCategory(id: number, hard: boolean = true): Promise<void> {
    await api.delete(`/admin/categories/${id}`, {
      params: { hard },
    });
  },

  async uploadImage(id: number, file: File): Promise<Category> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<ApiResponse<Category>>(
      `/admin/categories/${id}/image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  },
};
