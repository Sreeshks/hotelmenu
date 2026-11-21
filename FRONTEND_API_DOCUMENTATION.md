# Hotel Menu - Customer Frontend API Documentation

This document describes all the backend APIs required to build a new customer-facing frontend. It includes the live production endpoints, request formats, response payloads, real sample responses, and the real-time WebSocket protocol.

---

## 1. Base Configuration & Environments

### Live Backend URLs
* **REST API Base URL**: `https://hotelmenu2-api-056e19-187-126-121-79.sslip.io/api/v1`
* **WebSocket Base URL**: `wss://hotelmenu2-api-056e19-187-126-121-79.sslip.io/api/v1/ws`
* **Interactive Swagger UI**: `https://hotelmenu2-api-056e19-187-126-121-79.sslip.io/docs`
* **OpenAPI Schema (JSON)**: `https://hotelmenu2-api-056e19-187-126-121-79.sslip.io/openapi.json`
* **Default Location Token**: `main-menu`

### Common Headers
```http
Accept: application/json
Content-Type: application/json
```
*(No authentication or bearer token is required for customer endpoints).*

### Standard API Response Wrapper
Most endpoints return data encapsulated in a standard wrapper:
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```

---

## 2. Core Endpoint: Complete Digital Menu Bundle

Fetches the entire restaurant profile, categories, banners, menu catalog, highlights, daily specials, and combos in a single request.

### `GET /menu/{qr_token}`
* **Method**: `GET`
* **URL**: `https://hotelmenu2-api-056e19-187-126-121-79.sslip.io/api/v1/menu/main-menu`
* **Path Parameter**: `qr_token` (string) — e.g., `main-menu`

#### Response Payload Structure:
```json
{
  "location": {
    "id": 1,
    "name": "Kootucurry",
    "type": "RESTAURANT",
    "table_number": null,
    "room_number": null,
    "restaurant_name": "Koottu Curry Restaurant",
    "tagline": "Authentic Kerala, Malabar & Arabic Cuisine",
    "address": "Mabelah Sanayya / Musannah",
    "city": "Oman",
    "phone": "+968 9111 0588",
    "whatsapp_number": "+968 9111 0588",
    "online_ordering_enabled": true,
    "hours": "Daily 06:00 AM – 12:00 AM",
    "currency": "OMR ",
    "wifi_ssid": "KoottuCurry-Guest",
    "logo_url": "https://i.ibb.co/test_logo.png",
    "theme_preset": "navy",
    "primary_color": "#1E3A8A",
    "secondary_color": "#EAB308",
    "accent_color": "#172554"
  },
  "today_day_name": "Friday",
  "categories": [
    {
      "id": 44,
      "name": "BREAKFAST",
      "slug": "breakfast",
      "description": null,
      "icon": null,
      "image": "https://i.ibb.co/FpxgD25/South-Indian-Breakfast-Feast.png",
      "display_order": 0,
      "item_count": 28
    }
  ],
  "banners": [
    {
      "id": 1,
      "title": "Welcome to Koottu Curry",
      "subtitle": "Authentic Kerala Cuisine",
      "description": "Experience genuine flavours and warm hospitality.",
      "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947",
      "display_order": 1,
      "link_url": null,
      "button_text": null
    }
  ],
  "menu_items": [
    {
      "id": 457,
      "category_id": 44,
      "category_name": "BREAKFAST",
      "name": "EGG TOMATO",
      "slug": "egg-tomato",
      "short_description": null,
      "description": null,
      "price": 0.6,
      "original_price": null,
      "image_url": "https://instantcooks.com/wp-content/uploads/2025/03/Vibrant-Chinese-Tomato-Egg-Stir-Fry.jpg",
      "images": [
        "https://instantcooks.com/wp-content/uploads/2025/03/Vibrant-Chinese-Tomato-Egg-Stir-Fry.jpg"
      ],
      "rating": 4.5,
      "review_count": 8,
      "is_available": true,
      "is_featured": false,
      "is_popular": false,
      "is_bestseller": false,
      "is_combo": false,
      "combo_items": null,
      "is_daily_offer": false,
      "offer_days": null,
      "is_vegetarian": false,
      "preparation_time": null,
      "tags": null,
      "display_order": 0
    }
  ],
  "featured_items": [],
  "popular_items": [],
  "bestsellers": [],
  "today_offers": [
    {
      "id": 12,
      "name": "Friday Special Biryani",
      "price": 1.2,
      "original_price": 1.5,
      "is_daily_offer": true,
      "offer_days": "Friday",
      "is_available": true
    }
  ],
  "combo_offers": [
    {
      "id": 494,
      "name": "PORATTA COMBO SET",
      "price": 0.6,
      "original_price": 0.8,
      "is_combo": true,
      "combo_items": "Poratta, Beef Curry, Tea",
      "is_available": true
    }
  ]
}
```

---

## 3. Menu Version & Cache Checking

Used by frontends to check whether menu data has changed on the backend before doing a full reload.

### `GET /menu/{qr_token}/version`
* **Method**: `GET`
* **URL**: `https://hotelmenu2-api-056e19-187-126-121-79.sslip.io/api/v1/menu/main-menu/version`
* **Response**:
```json
{
  "version": 614
}
```

---

## 4. Search & Filter Menu Items

### `GET /menu/{qr_token}/search`
* **Method**: `GET`
* **URL**: `https://hotelmenu2-api-056e19-187-126-121-79.sslip.io/api/v1/menu/main-menu/search`
* **Query Parameters**:
  | Parameter | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `search` (or `q`) | `string` | No | Text query across dish names, descriptions, and tags |
  | `category_id` | `integer` | No | Filter by specific category ID |
  | `is_available` | `boolean` | No | Filter by stock availability (`true`/`false`) |
  | `page` | `integer` | No | Page number (default: `1`) |
  | `limit` | `integer` | No | Items per page (default: `20`, max: `100`) |

#### Example Request:
```http
GET https://hotelmenu2-api-056e19-187-126-121-79.sslip.io/api/v1/menu/main-menu/search?search=dosa&limit=10
```

#### Example Response:
```json
{
  "success": true,
  "message": "Menu items found",
  "data": [
    {
      "id": 468,
      "category_id": 44,
      "category_name": "BREAKFAST",
      "name": "EGG MASALA DOSA",
      "slug": "egg-masala-dosa",
      "price": 0.8,
      "original_price": null,
      "is_available": true,
      "is_vegetarian": false,
      "image_url": "https://vismaifood.com/storage/app/uploads/public/a95/608/610/thumb__1200_0_0_0_auto.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total_items": 4,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

---

## 5. Single Menu Item Details

### `GET /menu-items/{id}`
* **Method**: `GET`
* **URL**: `https://hotelmenu2-api-056e19-187-126-121-79.sslip.io/api/v1/menu-items/457`
* **Path Parameter**: `id` (integer) — Dish ID

#### Response:
```json
{
  "success": true,
  "message": "Menu item retrieved successfully",
  "data": {
    "id": 457,
    "category_id": 44,
    "name": "EGG TOMATO",
    "slug": "egg-tomato",
    "short_description": null,
    "description": null,
    "price": 0.6,
    "original_price": null,
    "is_combo": false,
    "combo_items": null,
    "is_daily_offer": false,
    "offer_days": null,
    "image_url": "https://instantcooks.com/wp-content/uploads/2025/03/Vibrant-Chinese-Tomato-Egg-Stir-Fry.jpg",
    "images": [
      "https://instantcooks.com/wp-content/uploads/2025/03/Vibrant-Chinese-Tomato-Egg-Stir-Fry.jpg"
    ],
    "rating": 4.5,
    "review_count": 8,
    "is_available": true,
    "is_featured": false,
    "is_popular": false,
    "is_bestseller": false,
    "display_order": 0,
    "preparation_time": null,
    "tags": null,
    "is_vegetarian": false,
    "is_active": true
  }
}
```

---

## 6. Restaurant Settings & WhatsApp Checkout Configuration

Fetches live restaurant information including online ordering toggle status, WhatsApp number, and branding colors.

### `GET /settings`
* **Method**: `GET`
* **URL**: `https://hotelmenu2-api-056e19-187-126-121-79.sslip.io/api/v1/settings`

#### Response:
```json
{
  "success": true,
  "message": "Settings retrieved successfully",
  "data": {
    "restaurant_name": "Koottu Curry Restaurant",
    "tagline": "Authentic Kerala, Malabar & Arabic Cuisine",
    "currency": "OMR ",
    "dining_hours": "Daily 06:00 AM – 12:00 AM",
    "phone": "+968 9111 0588",
    "whatsapp_number": "+968 9111 0588",
    "online_ordering_enabled": true,
    "address": "Mabelah Sanayya / Musannah",
    "city": "Oman",
    "wifi_ssid": "KoottuCurry-Guest",
    "logo_url": "https://i.ibb.co/test_logo.png",
    "theme_preset": "navy",
    "primary_color": "#1E3A8A",
    "secondary_color": "#EAB308",
    "accent_color": "#172554"
  }
}
```

### WhatsApp Ordering Logic (Client-Side)
When `online_ordering_enabled` is `true`:
1. Customer selects dishes and quantities into a local cart state.
2. Clean the phone number (remove spaces and `+` signs):
   ```js
   const cleanNumber = whatsapp_number.replace(/[^0-9]/g, "");
   ```
3. Format the order message:
   ```
   *🍽️ NEW ORDER - Koottu Curry Restaurant*
   Table / Location: Kootucurry

   *Ordered Items:*
   • 2x EGG MASALA DOSA (OMR 1.600)
   • 1x KARAK TEA (OMR 0.100)

   *Total: OMR 1.700*
   ```
4. Generate the checkout redirection URL:
   ```
   https://wa.me/{cleanNumber}?text={encodeURIComponent(orderText)}
   ```

---

## 7. Weekday Daily Offers & Combos

### `GET /offers/daily`
* **Method**: `GET`
* **URL**: `https://hotelmenu2-api-056e19-187-126-121-79.sslip.io/api/v1/offers/daily`
* **Query Parameter**:
  * `day` (`string`, optional): e.g., `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`, `Sunday`

#### Response:
```json
{
  "success": true,
  "message": "Found 3 daily offer items",
  "data": [
    {
      "id": 105,
      "name": "Nadan Meals Special",
      "price": 1.0,
      "original_price": 1.3,
      "is_daily_offer": true,
      "offer_days": "Friday,Saturday",
      "is_available": true
    }
  ]
}
```

### `GET /offers/combos`
* **Method**: `GET`
* **URL**: `https://hotelmenu2-api-056e19-187-126-121-79.sslip.io/api/v1/offers/combos`

#### Response:
```json
{
  "success": true,
  "message": "Found combo offer items",
  "data": [
    {
      "id": 494,
      "name": "PORATTA COMBO SET",
      "price": 0.6,
      "original_price": 0.8,
      "is_combo": true,
      "combo_items": "Poratta, Beef Curry, Tea",
      "is_available": true
    }
  ]
}
```

---

## 8. Categories & Promo Banners

### `GET /categories`
* **Method**: `GET`
* **URL**: `https://hotelmenu2-api-056e19-187-126-121-79.sslip.io/api/v1/categories`

#### Response:
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": 44,
      "name": "BREAKFAST",
      "slug": "breakfast",
      "description": null,
      "image": "https://i.ibb.co/FpxgD25/South-Indian-Breakfast-Feast.png",
      "display_order": 0,
      "is_active": true
    }
  ]
}
```

### `GET /banners`
* **Method**: `GET`
* **URL**: `https://hotelmenu2-api-056e19-187-126-121-79.sslip.io/api/v1/banners`

#### Response:
```json
{
  "success": true,
  "message": "Active banners retrieved successfully",
  "data": [
    {
      "id": 1,
      "title": "Welcome to Koottu Curry",
      "subtitle": "Authentic Kerala Cuisine",
      "description": "Experience genuine flavours and warm hospitality.",
      "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947",
      "display_order": 1,
      "link_url": null,
      "button_text": null,
      "is_active": true
    }
  ]
}
```

---

## 9. Staff Profile & Rating Statistics

### `GET /staff`
* **Method**: `GET`
* **URL**: `https://hotelmenu2-api-056e19-187-126-121-79.sslip.io/api/v1/staff`

#### Response:
```json
{
  "success": true,
  "message": "Active staff retrieved successfully",
  "data": [
    {
      "id": 7,
      "name": "David Chen",
      "employee_code": "EMP-003",
      "profile_image": null,
      "designation": "Head Server",
      "average_rating": 4.7,
      "total_ratings": 38,
      "is_active": true
    }
  ]
}
```

### `GET /staff/{id}/ratings`
* **Method**: `GET`
* **URL**: `https://hotelmenu2-api-056e19-187-126-121-79.sslip.io/api/v1/staff/7/ratings`

#### Response:
```json
{
  "success": true,
  "message": "Staff ratings retrieved successfully",
  "data": {
    "average_rating": 4.7,
    "total_ratings": 38,
    "distribution": {
      "1": 0,
      "2": 1,
      "3": 2,
      "4": 8,
      "5": 27
    }
  }
}
```

---

## 10. Reviews & Feedback System

### 10.1 List Reviews
### `GET /reviews`
* **Method**: `GET`
* **URL**: `https://hotelmenu2-api-056e19-187-126-121-79.sslip.io/api/v1/reviews`
* **Query Parameters**:
  * `review_type` (`string`, optional): `MENU_ITEM`, `STAFF`, or `RESTAURANT`
  * `menu_item_id` (`integer`, optional): Filter reviews for a dish
  * `staff_id` (`integer`, optional): Filter reviews for a server
  * `page` (`integer`, optional, default: `1`)
  * `limit` (`integer`, optional, default: `10`)

#### Response:
```json
{
  "success": true,
  "message": "Reviews retrieved successfully",
  "data": [
    {
      "id": 3,
      "customer_name": "Chloe Bennett",
      "customer_identifier": "cust-demo-3",
      "review_type": "RESTAURANT",
      "rating": 5,
      "review_text": "Wonderful ambiance and seamless QR code menu experience. Will visit again!",
      "images": [],
      "is_approved": true,
      "is_visible": true,
      "created_at": "2026-10-12T16:01:05.887525Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total_items": 1,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

---

### 10.2 Submit a Review
### `POST /reviews`
* **Method**: `POST`
* **URL**: `https://hotelmenu2-api-056e19-187-126-121-79.sslip.io/api/v1/reviews`
* **Headers**: `Content-Type: application/json`

#### Request Body:
```json
{
  "customer_name": "John Doe",
  "customer_identifier": "anonymous-guest-101",
  "review_type": "MENU_ITEM",
  "menu_item_id": 457,
  "staff_id": null,
  "location_id": 1,
  "rating": 5,
  "review_text": "Absolutely delicious, freshly made and arrived hot!",
  "image_urls": [
    "https://i.ibb.co/example_review_dish.jpg"
  ]
}
```

#### Response (`201 Created` or `200 OK`):
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "id": 4,
    "customer_name": "John Doe",
    "rating": 5,
    "review_text": "Absolutely delicious, freshly made and arrived hot!",
    "is_approved": true,
    "is_visible": true,
    "created_at": "2026-11-21T15:10:00Z"
  }
}
```

---

### 10.3 Upload Image for Review
Uploads a photo for attaching to customer reviews.

### `POST /reviews/upload-image`
* **Method**: `POST`
* **URL**: `https://hotelmenu2-api-056e19-187-126-121-79.sslip.io/api/v1/reviews/upload-image`
* **Headers**: `Content-Type: multipart/form-data`
* **Form-Data**:
  * `file`: `[File Binary]`

#### Response:
```json
{
  "success": true,
  "message": "Review image uploaded successfully",
  "data": "https://i.ibb.co/34b1022bc8d3afbe2dc9875cba76714d/review_upload.jpg"
}
```

---

## 11. Real-Time WebSocket Channel

The frontend connects to a persistent WebSocket channel for live kitchen availability updates, stock flips, and menu version refreshes without polling.

### WebSocket Connection URL
```
wss://hotelmenu2-api-056e19-187-126-121-79.sslip.io/api/v1/ws/menu/{qr_token}
```
*Example*: `wss://hotelmenu2-api-056e19-187-126-121-79.sslip.io/api/v1/ws/menu/main-menu`

### 1. Live Kitchen Stock Flip Event: `MENU_ITEM_AVAILABILITY_CHANGED`
Broadcasted when an admin marks an item out-of-stock or restores it to available stock in real-time.

#### Message Payload:
```json
{
  "event": "MENU_ITEM_AVAILABILITY_CHANGED",
  "data": {
    "menu_item_id": 457,
    "is_available": false,
    "name": "EGG TOMATO"
  }
}
```
* **Frontend Action**: Immediately update the matching item's `is_available` state in memory and disable the "Add to Cart" button.

---

### 2. General Menu Catalog Update Events
Broadcasted when items, categories, banners, or restaurant branding colors change in the admin panel.

#### Event Names:
* `MENU_ITEM_CREATED`
* `MENU_ITEM_UPDATED`
* `MENU_ITEM_DELETED`
* `CATEGORY_UPDATED`
* `BANNER_UPDATED`
* `MENU_VERSION_UPDATED`
* `SETTINGS_UPDATED`

#### Message Payload for `SETTINGS_UPDATED`:
```json
{
  "event": "SETTINGS_UPDATED",
  "data": {
    "online_ordering_enabled": true,
    "whatsapp_number": "+968 9111 0588",
    "primary_color": "#1E3A8A",
    "secondary_color": "#EAB308",
    "accent_color": "#172554"
  }
}
```
* **Frontend Action**: Refetch `/menu/{qr_token}` or dynamically update theme CSS variables / online ordering toggle state.

### Reconnection Strategy:
If the WebSocket connection drops, implement an exponential or 4-second retry timer (`ws.onclose`) to automatically reconnect.
