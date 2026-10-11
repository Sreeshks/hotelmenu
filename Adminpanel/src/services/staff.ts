import api from "@/lib/api";
import { Staff, StaffInput, StaffRatingStats, ApiResponse } from "@/types";

export const staffService = {
  async getStaffList(): Promise<Staff[]> {
    const response = await api.get<ApiResponse<Staff[]>>("/admin/staff");
    return response.data.data;
  },

  async getStaff(id: number): Promise<Staff> {
    const response = await api.get<ApiResponse<Staff>>(`/admin/staff/${id}`);
    return response.data.data;
  },

  async createStaff(data: StaffInput): Promise<Staff> {
    const response = await api.post<ApiResponse<Staff>>("/admin/staff", data);
    return response.data.data;
  },

  async updateStaff(id: number, data: Partial<StaffInput>): Promise<Staff> {
    const response = await api.put<ApiResponse<Staff>>(`/admin/staff/${id}`, data);
    return response.data.data;
  },

  async deleteStaff(id: number, hard: boolean = true): Promise<void> {
    await api.delete(`/admin/staff/${id}`, {
      params: { hard },
    });
  },

  async getStaffRatings(id: number): Promise<StaffRatingStats> {
    const response = await api.get<ApiResponse<StaffRatingStats>>(`/admin/staff/${id}/ratings`);
    return response.data.data;
  },

  async uploadImage(id: number, file: File): Promise<Staff> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<ApiResponse<Staff>>(
      `/admin/staff/${id}/image`,
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
