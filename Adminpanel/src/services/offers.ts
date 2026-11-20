import api from "@/lib/api";
import { MenuItem, ApiResponse, ComboItemDetail } from "@/types";

export interface SetDailyOfferInput {
  item_id: number;
  offer_days: string[];
  offer_price: number;
  original_price?: number;
}

export interface CreateComboOfferInput {
  name: string;
  category_id: number;
  price: number;
  original_price?: number;
  combo_items: ComboItemDetail[];
  image_url?: string;
  short_description?: string;
  description?: string;
  offer_days?: string[];
  is_vegetarian?: boolean;
}

export const offersService = {
  async getDailyOffers(day?: string): Promise<MenuItem[]> {
    const params = day ? { day } : {};
    const res = await api.get<ApiResponse<MenuItem[]>>("/offers/daily", { params });
    return res.data.data;
  },

  async getComboOffers(): Promise<MenuItem[]> {
    const res = await api.get<ApiResponse<MenuItem[]>>("/offers/combos");
    return res.data.data;
  },

  async setDailyOffer(data: SetDailyOfferInput): Promise<MenuItem> {
    const res = await api.post<ApiResponse<MenuItem>>("/offers/daily", data);
    return res.data.data;
  },

  async removeDailyOffer(itemId: number): Promise<void> {
    await api.delete(`/offers/daily/${itemId}`);
  },

  async createComboOffer(data: CreateComboOfferInput): Promise<MenuItem> {
    const res = await api.post<ApiResponse<MenuItem>>("/offers/combo", data);
    return res.data.data;
  },
};
