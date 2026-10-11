import api from "@/lib/api";
import { ApiResponse } from "@/types";

export const uploadService = {
  /**
   * Uploads an image file to ImgBB via the backend storage service.
   * Returns the publicly accessible ImgBB URL (e.g. https://i.ibb.co/...).
   */
  async uploadImage(file: File, subfolder: string = "general"): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("subfolder", subfolder);

    const response = await api.post<ApiResponse<string>>(
      "/admin/upload-image",
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
