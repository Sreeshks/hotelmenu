export interface CustomerLocationInfo {
  id: number;
  name: string;
  type: string;
  table_number?: string | null;
  room_number?: string | null;
  restaurant_name?: string | null;
  currency?: string | null;
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
  created_at?: string;
  updated_at?: string;
}

export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  price: number;
  image_url?: string | null;
  rating: number;
  review_count: number;
  is_available: boolean;
  is_featured: boolean;
  is_popular: boolean;
  is_bestseller: boolean;
  display_order: number;
  preparation_time?: string | null;
  tags?: string | null;
  is_active?: boolean;
  category_name?: string | null;
  category?: Category | null;
  reviews?: Review[];
  is_vegetarian?: boolean;
  ingredients?: string | null;
  allergens?: string | null;
  calories?: number | null;
  preparation_time_minutes?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  average_rating?: number | null;
  total_reviews?: number | null;
  currency?: string | null;
  created_at?: string;
  updated_at?: string;
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
  updated_at?: string;
  images: ReviewImage[];
  menu_item_name?: string | null;
  staff_name?: string | null;
  location_name?: string | null;
}

export interface ReviewCreate {
  customer_name?: string;
  customer_identifier?: string;
  review_type?: "MENU_ITEM" | "STAFF" | "RESTAURANT";
  menu_item_id?: number;
  staff_id?: number;
  location_id?: number;
  rating: number;
  review_text?: string;
  image_urls?: string[];
}

export interface CustomerMenuResponse {
  location: CustomerLocationInfo;
  categories: Category[];
  banners: Banner[];
  menu_items: MenuItem[];
  featured_items: MenuItem[];
  popular_items: MenuItem[];
  bestsellers: MenuItem[];
}

export interface RestaurantInfo {
  name: string;
  tagline: string;
  address: string;
  city: string;
  phone: string;
  hours: string;
  currency: string;
  wifi_ssid?: string;
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
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface MenuVersionResponse {
  version: number;
}
