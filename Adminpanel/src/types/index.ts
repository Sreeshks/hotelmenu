export interface Admin {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "admin";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  admin: Admin;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  display_order: number;
  is_active: boolean;
  item_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
  icon?: string | null;
  image?: string | null;
  display_order?: number;
  is_active?: boolean;
}

export interface ComboItemDetail {
  id: number;
  name: string;
  price: number;
  quantity?: number;
  image_url?: string | null;
}

export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  price: number;
  original_price?: number | null;
  is_combo?: boolean;
  combo_items?: ComboItemDetail[] | string | null;
  image_url?: string | null;
  images?: string[] | null;
  rating: number;
  review_count: number;
  is_available: boolean;
  is_featured: boolean;
  is_popular: boolean;
  is_bestseller: boolean;
  display_order: number;
  preparation_time?: string | null;
  tags?: string | null;
  is_active: boolean;
  category_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MenuItemInput {
  category_id: number;
  name: string;
  slug?: string;
  short_description?: string;
  description?: string;
  price: number;
  original_price?: number | null;
  is_combo?: boolean;
  combo_items?: ComboItemDetail[] | string | null;
  image_url?: string;
  images?: string[];
  is_available?: boolean;
  is_featured?: boolean;
  is_popular?: boolean;
  is_bestseller?: boolean;
  display_order?: number;
  preparation_time?: string;
  tags?: string;
}

export interface ImageSearchResult {
  url: string;
  thumb_url?: string | null;
  title?: string | null;
  source?: string | null;
}

export interface Banner {
  id: number;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  image_url: string;
  button_text?: string | null;
  button_link?: string | null;
  display_order: number;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BannerInput {
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  button_text?: string;
  button_link?: string;
  display_order?: number;
  is_active?: boolean;
  start_date?: string;
  end_date?: string;
}

export interface Staff {
  id: number;
  name: string;
  employee_code: string;
  profile_image?: string | null;
  designation: string;
  average_rating: number;
  total_ratings: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffInput {
  name: string;
  employee_code: string;
  profile_image?: string;
  designation: string;
  is_active?: boolean;
}

export interface StaffRatingStats {
  average_rating: number;
  total_ratings: number;
  distribution: Record<string, number>;
}

export interface Location {
  id: number;
  name: string;
  location_type: "TABLE" | "ROOM" | "RESTAURANT" | "OTHER";
  table_number?: string | null;
  room_number?: string | null;
  qr_token: string;
  is_active: boolean;
  qr_image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocationInput {
  name: string;
  location_type: "TABLE" | "ROOM" | "RESTAURANT" | "OTHER";
  table_number?: string;
  room_number?: string;
  is_active?: boolean;
}

export interface QRCodeData {
  id: number;
  location_id: number;
  token: string;
  qr_image_url?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ReviewImage {
  id: number;
  review_id: number;
  image_url: string;
  created_at: string;
}

export interface Review {
  id: number;
  customer_name?: string | null;
  customer_identifier: string;
  review_type: "MENU_ITEM" | "STAFF" | "RESTAURANT";
  menu_item_id?: number | null;
  staff_id?: number | null;
  location_id?: number | null;
  rating: number;
  review_text?: string | null;
  is_approved: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  images: ReviewImage[];
  menu_item_name?: string | null;
  staff_name?: string | null;
  location_name?: string | null;
}

export interface DashboardStats {
  total_menu_items: number;
  available_items: number;
  out_of_stock_items: number;
  total_categories: number;
  total_staff: number;
  total_reviews: number;
  average_restaurant_rating: number;
  recent_reviews: Review[];
  popular_items: MenuItem[];
  top_staff: Staff[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: PaginationMeta;
}
