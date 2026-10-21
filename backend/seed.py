import os
import sys
import json

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
import app.models  # Register all models for metadata
from app.core.security import hash_password
from app.core.config import settings
from app.models.admin import Admin
from app.models.category import Category
from app.models.menu_item import MenuItem
from app.models.banner import Banner
from app.models.staff import Staff
from app.models.location import Location
from app.models.qr_code import QRCode
from app.models.review import Review
from app.models.menu_version import MenuVersion
from app.utils.qr_generator import create_qr_code_image


def seed_database():
    # Ensure all tables exist before querying or inserting
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        print("Starting unified Koottu Curry database seeding...")

        # 0. Menu Version
        version_rec = db.query(MenuVersion).filter(MenuVersion.key == "global").first()
        if not version_rec:
            version_rec = MenuVersion(key="global", version=1)
            db.add(version_rec)
            db.commit()
            print("  Created initial MenuVersion record.")
        else:
            version_rec.version += 1
            db.commit()

        # 1. Admin Users
        for adm_email, adm_pass, adm_name in [
            ("admin@hotel.com", "admin123", "Executive Hotel Admin"),
            ("admin@example.com", "password123", "System Administrator"),
        ]:
            existing_adm = db.query(Admin).filter(Admin.email == adm_email).first()
            if not existing_adm:
                admin_obj = Admin(
                    name=adm_name,
                    email=adm_email,
                    password_hash=hash_password(adm_pass),
                    role="super_admin",
                    is_active=True,
                )
                db.add(admin_obj)
                db.commit()
                print(f"  Created Admin: {adm_email} / {adm_pass}")
            else:
                existing_adm.password_hash = hash_password(adm_pass)
                existing_adm.is_active = True
                db.commit()
                print(f"  Admin {adm_email} already exists - password refreshed.")

        # 2. Load Koottu Curry Menu Catalog (30 Categories, 329 Items)
        catalog_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "koottu_curry_catalog.json")
        if not os.path.exists(catalog_path):
            print(f"  Warning: {catalog_path} not found! Cannot seed menu items.")
            return

        with open(catalog_path, "r", encoding="utf-8") as f:
            categories_catalog = json.load(f)

        cat_map = {}
        for cdata in categories_catalog:
            cat = db.query(Category).filter(Category.slug == cdata["slug"]).first()
            if not cat:
                cat = Category(
                    name=cdata["name"],
                    slug=cdata["slug"],
                    description=cdata.get("description", ""),
                    image=cdata.get("image", ""),
                    display_order=cdata.get("display_order", 0),
                    is_active=True,
                )
                db.add(cat)
                db.commit()
                db.refresh(cat)
                print(f"  Created Category: {cat.name} ({len(cdata.get('items', []))} items)")
            else:
                cat.name = cdata["name"]
                cat.image = cdata.get("image", cat.image)
                cat.description = cdata.get("description", cat.description)
                cat.display_order = cdata.get("display_order", cat.display_order)
                cat.is_active = True
                db.commit()
            cat_map[cat.slug] = cat

        # 3. Seed Menu Items
        item_map = {}
        total_items_created = 0
        total_items_updated = 0

        for cdata in categories_catalog:
            parent_cat = cat_map.get(cdata["slug"])
            if not parent_cat:
                continue

            for idata in cdata.get("items", []):
                slug = idata["slug"]
                item = db.query(MenuItem).filter(MenuItem.slug == slug).first()
                if not item:
                    item = MenuItem(
                        category_id=parent_cat.id,
                        name=idata["name"],
                        slug=slug,
                        short_description=idata.get("short_description", ""),
                        description=idata.get("description", ""),
                        price=idata.get("price", 0.0),
                        original_price=idata.get("original_price"),
                        image_url=idata.get("image_url", ""),
                        rating=4.8,
                        review_count=12,
                        is_available=idata.get("is_available", True),
                        is_featured=idata.get("display_order", 999) <= 3,
                        is_popular=True,
                        is_bestseller=idata.get("display_order", 999) <= 2,
                        display_order=idata.get("display_order", 0),
                        tags=idata.get("tags", ""),
                        is_vegetarian=idata.get("is_vegetarian", False),
                        is_combo=idata.get("is_combo", False),
                        is_active=True,
                    )
                    db.add(item)
                    db.commit()
                    db.refresh(item)
                    total_items_created += 1
                else:
                    item.category_id = parent_cat.id
                    item.name = idata["name"]
                    item.price = idata.get("price", item.price)
                    item.original_price = idata.get("original_price", item.original_price)
                    item.short_description = idata.get("short_description", item.short_description)
                    item.description = idata.get("description", item.description)
                    if idata.get("image_url"):
                        item.image_url = idata["image_url"]
                    item.tags = idata.get("tags", item.tags)
                    item.is_vegetarian = idata.get("is_vegetarian", item.is_vegetarian)
                    item.is_combo = idata.get("is_combo", item.is_combo)
                    item.is_active = True
                    db.commit()
                    total_items_updated += 1

                item_map[slug] = item

        print(f"  Menu items seeding complete: {total_items_created} created, {total_items_updated} updated.")

        # 4. Staff members
        staff_data = [
            {
                "name": "Alex Mercer",
                "employee_code": "EMP-001",
                "role": "Head Server",
                "section": "Dining Room A",
                "image_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
                "rating": 4.9,
                "review_count": 87,
            },
            {
                "name": "Sarah Jenkins",
                "employee_code": "EMP-002",
                "role": "Senior Hostess",
                "section": "Front Lobby & Terrace",
                "image_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
                "rating": 4.8,
                "review_count": 64,
            },
        ]

        staff_map = {}
        for sdata in staff_data:
            st = db.query(Staff).filter(Staff.employee_code == sdata["employee_code"]).first()
            if not st:
                st = Staff(
                    name=sdata["name"],
                    employee_code=sdata["employee_code"],
                    role=sdata["role"],
                    section=sdata["section"],
                    image_url=sdata["image_url"],
                    rating=sdata["rating"],
                    review_count=sdata["review_count"],
                    is_active=True,
                )
                db.add(st)
                db.commit()
                db.refresh(st)
                print(f"  Created Staff Member: {st.name}")
            else:
                st.image_url = sdata["image_url"]
                st.rating = sdata["rating"]
                st.review_count = sdata["review_count"]
                st.is_active = True
                db.commit()
            staff_map[st.employee_code] = st

        # 5. SINGLE UNIFIED QR CODE
        qr_output_dir = os.path.join(settings.UPLOAD_DIR, "qrcodes")
        os.makedirs(qr_output_dir, exist_ok=True)

        old_tables = db.query(Location).filter(Location.qr_token != "main-menu").all()
        for ot in old_tables:
            ot.is_active = False

        unified_token = "main-menu"
        main_loc = db.query(Location).filter(Location.qr_token == unified_token).first()
        if not main_loc:
            main_loc = Location(
                name="Koottu Curry Restaurant",
                location_type="RESTAURANT",
                table_number=None,
                room_number=None,
                qr_token=unified_token,
                is_active=True,
            )
            db.add(main_loc)
            db.commit()
            db.refresh(main_loc)
        else:
            main_loc.name = "Koottu Curry Restaurant"
            main_loc.location_type = "RESTAURANT"
            main_loc.table_number = None
            main_loc.room_number = None
            main_loc.is_active = True
            db.commit()

        qr_url = create_qr_code_image(unified_token, settings.FRONTEND_URL, qr_output_dir)

        qr = db.query(QRCode).filter(QRCode.location_id == main_loc.id).first()
        if not qr:
            qr = QRCode(
                location_id=main_loc.id,
                token=unified_token,
                qr_image_url=qr_url,
                is_active=True,
            )
            db.add(qr)
            db.commit()
        else:
            qr.token = unified_token
            qr.qr_image_url = qr_url
            qr.is_active = True
            db.commit()

        print(f"  Unified QR Code ready for '{main_loc.name}' with token: {unified_token}")

        # 6. Sample Banners
        banners_data = [
            {
                "title": "Authentic Malabar Biriyani",
                "subtitle": "Kudukka, Fresh Beef, Chicken & Mutton",
                "description": "Slow-cooked fragrant kaima rice infused with traditional Kerala spices and tender cuts.",
                "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=80",
                "button_text": "Explore Biriyani",
                "button_link": "/menu",
                "display_order": 1,
            },
            {
                "title": "Fresh Arabian Mandi & Charcoal",
                "subtitle": "Fire Chicken, Alfaham & Shuwa",
                "description": "Smoky char-grilled delicacies seasoned with exotic Arabian spices.",
                "image_url": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80",
                "button_text": "View Grills",
                "button_link": "/menu",
                "display_order": 2,
            },
            {
                "title": "Hot Kerala Poratta & Curries",
                "subtitle": "Flaky Layered Bread with Nadan Gravies",
                "description": "Golden griddled parottas, beef roast, chicken curry, and fresh tiffins.",
                "image_url": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=1200&q=80",
                "button_text": "Order Now",
                "button_link": "/menu",
                "display_order": 3,
            },
        ]

        for bdata in banners_data:
            ban = db.query(Banner).filter(Banner.title == bdata["title"]).first()
            if not ban:
                ban = Banner(
                    title=bdata["title"],
                    subtitle=bdata["subtitle"],
                    description=bdata["description"],
                    image_url=bdata["image_url"],
                    button_text=bdata["button_text"],
                    button_link=bdata["button_link"],
                    display_order=bdata["display_order"],
                    is_active=True,
                )
                db.add(ban)
                db.commit()
                print(f"  Created Banner: {ban.title}")
            else:
                ban.image_url = bdata["image_url"]
                ban.subtitle = bdata["subtitle"]
                ban.description = bdata["description"]
                ban.display_order = bdata["display_order"]
                ban.is_active = True
                db.commit()

        print("\nUnified Koottu Curry database seeding completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
