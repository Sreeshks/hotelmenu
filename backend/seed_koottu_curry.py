import json
import os
import sys
import time
import concurrent.futures
from urllib.parse import quote

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models.category import Category
from app.models.menu_item import MenuItem
from app.models.review import Review
from app.models.location import Location
from app.models.qr_code import QRCode
from app.models.admin import Admin
from app.models.menu_version import MenuVersion
from app.core.security import hash_password
from app.utils.slug import slugify
from app.services.image_search_service import image_search_service

# Load catalog
with open("koottu_curry_catalog.json", "r", encoding="utf-8") as f:
    categories_catalog = json.load(f)

# Curated fallback images by category in case web search is throttled
FALLBACK_IMAGES = {
    "Breakfast & Traditional Tiffins": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976", # Dosa
    "Kerala Breads & Puttu": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46", # Parotta
    "Biriyani & Ghee Rice Specials": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8", # Biriyani
    "Mandi & Arabic Specials": "https://images.unsplash.com/photo-1544025162-d76694265947", # Mandi / Roast Meat
    "Chicken Specials": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398", # Chicken Curry
    "Beef Specials": "https://images.unsplash.com/photo-1544025162-d76694265947", # Beef Roast
    "Mutton Specials": "https://images.unsplash.com/photo-1544025162-d76694265947", # Mutton
    "Seafood & Fish Pollichathu": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb", # Fish
    "Vegetarian Specials": "https://images.unsplash.com/photo-1546833999-b9f581a1996d", # Veg curry
    "Charcoal & Grills": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1", # Charcoal grill
    "Salads, Hummus & Sandwiches": "https://images.unsplash.com/photo-1540420773420-3366772f4999", # Hummus salad
    "Mojitos & Coolers": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd", # Mojito
    "Fresh Juices & Kulukki": "https://images.unsplash.com/photo-1621263764928-df1444c5e859", # Juice
    "Desserts & Falooda": "https://images.unsplash.com/photo-1563805042-7684c019e1cb", # Falooda / Ice cream
    "Tea, Coffee & Kerala Snacks": "https://images.unsplash.com/photo-1576092768241-dec231879fc3", # Tea / Snacks
}

# Image cache file to resume/save
CACHE_FILE = "koottu_curry_images_cache.json"
image_cache = {}
if os.path.exists(CACHE_FILE):
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            image_cache = json.load(f)
        print(f"Loaded {len(image_cache)} cached images from {CACHE_FILE}")
    except Exception:
        pass

def fetch_single_image(item_name: str, cat_name: str) -> tuple:
    if item_name in image_cache and image_cache[item_name]:
        return item_name, image_cache[item_name]

    search_query = f"{item_name} Kerala food dish"
    try:
        results = image_search_service.search_images(search_query, limit=2)
        if results and results[0].get("url"):
            url = results[0]["url"]
            return item_name, url
    except Exception:
        pass

    # Secondary try with clean dish name
    try:
        clean_name = item_name.split("(")[0].strip()
        results2 = image_search_service.search_images(clean_name, limit=1)
        if results2 and results2[0].get("url"):
            return item_name, results2[0]["url"]
    except Exception:
        pass

    # Fallback to category hero image
    fallback = FALLBACK_IMAGES.get(cat_name, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c")
    return item_name, fallback

def main():
    print("Step 1: Fetching 1 related image for each of the 218 Koottu Curry items...")
    tasks = []
    for cat in categories_catalog:
        cat_name = cat["name"]
        for it in cat["items"]:
            it_name = it["name"]
            if it_name not in image_cache:
                tasks.append((it_name, cat_name))

    print(f"Items needing image search: {len(tasks)} (already cached: {len(image_cache)})")
    if tasks:
        # Run 8 concurrent worker threads for speed
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            future_to_item = {executor.submit(fetch_single_image, t[0], t[1]): t[0] for t in tasks}
            done_count = 0
            for future in concurrent.futures.as_completed(future_to_item):
                item_name, img_url = future.result()
                image_cache[item_name] = img_url
                done_count += 1
                if done_count % 25 == 0 or done_count == len(tasks):
                    print(f"  Fetched {done_count}/{len(tasks)} images...")

        # Save cache
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(image_cache, f, indent=2)
        print("Image cache saved successfully!")

    print("\nStep 2: Clearing existing database items, categories, and reviews...")
    db = SessionLocal()
    try:
        # Delete reviews first (foreign key dependency)
        deleted_reviews = db.query(Review).delete()
        print(f"  Deleted {deleted_reviews} existing reviews.")

        # Delete menu items
        deleted_items = db.query(MenuItem).delete()
        print(f"  Deleted {deleted_items} existing menu items.")

        # Delete categories
        deleted_cats = db.query(Category).delete()
        print(f"  Deleted {deleted_cats} existing categories.")

        db.commit()

        print("\nStep 3: Seeding Koottu Curry Restaurant categories and products...")
        cat_id_map = {}
        for c_idx, cat in enumerate(categories_catalog):
            cat_slug = slugify(cat["name"])
            category_obj = Category(
                name=cat["name"],
                slug=cat_slug,
                description=cat.get("description", ""),
                display_order=cat.get("display_order", c_idx + 1),
                is_active=True,
            )
            db.add(category_obj)
            db.commit()
            db.refresh(category_obj)
            cat_id_map[cat["name"]] = category_obj.id

        total_inserted = 0
        used_slugs = set()
        for cat in categories_catalog:
            cat_id = cat_id_map[cat["name"]]
            for it_idx, it in enumerate(cat["items"]):
                item_name = it["name"]
                base_slug = slugify(item_name)
                slug = base_slug
                counter = 1
                while slug in used_slugs:
                    slug = f"{base_slug}-{counter}"
                    counter += 1
                used_slugs.add(slug)

                # Get the 1 related image
                single_image_url = image_cache.get(item_name) or FALLBACK_IMAGES.get(cat["name"])
                images_list = [single_image_url] if single_image_url else []

                menu_item = MenuItem(
                    category_id=cat_id,
                    name=item_name,
                    slug=slug,
                    short_description=it.get("desc", f"Authentic {item_name} at Koottu Curry Restaurant")[:255],
                    description=it.get("desc", f"Freshly prepared {item_name} using authentic Kerala recipes and traditional ingredients."),
                    price=float(it["price"]),
                    image_url=single_image_url,
                    images=json.dumps(images_list),
                    rating=4.8 if it_idx < 3 else 4.5,
                    review_count=18 if it_idx < 3 else 6,
                    is_available=True,
                    is_featured=(it_idx == 0 and cat.get("display_order", 0) <= 6),
                    is_popular=("Bestseller" in it.get("tags", "") or "Popular" in it.get("tags", "")),
                    is_bestseller=("Bestseller" in it.get("tags", "") or it_idx == 0),
                    display_order=it_idx,
                    preparation_time="10-15 mins" if "Juice" in cat["name"] or "Tea" in cat["name"] else "15-25 mins",
                    tags=it.get("tags", "Authentic, Malabar"),
                    is_active=True,
                )
                db.add(menu_item)
                total_inserted += 1

        db.commit()
        print(f"Successfully inserted {len(categories_catalog)} categories and {total_inserted} products!")

        # Ensure unified Location exists
        loc = db.query(Location).filter(Location.qr_token == "main-menu").first()
        if not loc:
            loc = db.query(Location).first()
        if not loc:
            loc = Location(
                name="Koottu Curry Restaurant",
                location_type="RESTAURANT",
                table_number=None,
                room_number=None,
                qr_token="main-menu",
                is_active=True,
            )
            db.add(loc)
            db.commit()
            db.refresh(loc)
            print("Created Location record for 'Koottu Curry Restaurant'.")
        else:
            loc.name = "Koottu Curry Restaurant"
            loc.qr_token = "main-menu"
            loc.is_active = True
            db.commit()
            print("Updated Location record to 'Koottu Curry Restaurant'.")

        # Ensure QRCode record exists
        qr = db.query(QRCode).filter(QRCode.location_id == loc.id).first()
        if not qr:
            qr = QRCode(
                location_id=loc.id,
                token="main-menu",
                qr_image_url="/uploads/qrcodes/qr_main-menu.png",
                is_active=True,
            )
            db.add(qr)
            db.commit()
            print("Created QRCode record for 'main-menu'.")

        # Ensure Admin exists
        adm = db.query(Admin).filter(Admin.email == "admin@hotel.com").first()
        if not adm:
            adm = Admin(
                name="Executive Hotel Admin",
                email="admin@hotel.com",
                password_hash=hash_password("admin123"),
                role="super_admin",
                is_active=True,
            )
            db.add(adm)
            db.commit()
            print("Created Admin: admin@hotel.com / admin123")

        # Increment menu version
        version_rec = db.query(MenuVersion).filter(MenuVersion.key == "global").first()
        if version_rec:
            version_rec.version += 1
            db.commit()

        print("\nAll database operations completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error during database operation: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
