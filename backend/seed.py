import os
import sys

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
        print("Starting unified database seeding...")

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

        # 2. Categories with rich images
        categories_data = [
            {
                "name": "All Menu",
                "slug": "all-menu",
                "description": "Full complete menu selection",
                "image": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
                "display_order": 0,
            },
            {
                "name": "Starters",
                "slug": "starters",
                "description": "Crisp appetizers and finger foods to begin your dining",
                "image": "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=600&q=80",
                "display_order": 1,
            },
            {
                "name": "Main Course",
                "slug": "main-course",
                "description": "Hearty, chef-crafted entrees and specialty platters",
                "image": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
                "display_order": 2,
            },
            {
                "name": "Beverages",
                "slug": "beverages",
                "description": "Freshly squeezed juices, mocktails, and gourmet coffees",
                "image": "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80",
                "display_order": 3,
            },
            {
                "name": "Desserts",
                "slug": "desserts",
                "description": "Decadent handcrafted sweet endings and artisanal pastries",
                "image": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80",
                "display_order": 4,
            },
            {
                "name": "Offers",
                "slug": "offers",
                "description": "Exclusive daily specials and seasonal chef highlights",
                "image": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
                "display_order": 5,
            },
        ]

        cat_map = {}
        for cdata in categories_data:
            cat = db.query(Category).filter(Category.slug == cdata["slug"]).first()
            if not cat:
                cat = Category(
                    name=cdata["name"],
                    slug=cdata["slug"],
                    description=cdata["description"],
                    image=cdata["image"],
                    display_order=cdata["display_order"],
                    is_active=True,
                )
                db.add(cat)
                db.commit()
                db.refresh(cat)
                print(f"  Created Category: {cat.name}")
            else:
                cat.image = cdata["image"]
                cat.description = cdata["description"]
                db.commit()
            cat_map[cat.slug] = cat

        # 3. Menu Items with high-res food images
        menu_items_data = [
            {
                "category_slug": "main-course",
                "name": "Creamy Alfredo Pasta",
                "slug": "creamy-alfredo-pasta",
                "short_description": "Fettuccine tossed in rich garlic parmesan cream sauce",
                "description": "Al dente fettuccine coated in velvety homemade Alfredo sauce with roasted garlic, freshly cracked black pepper, aged Parmigiano-Reggiano, and tender grilled herb chicken.",
                "price": 14.50,
                "image_url": "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=800&q=80",
                "rating": 4.8,
                "review_count": 42,
                "is_available": True,
                "is_featured": True,
                "is_popular": True,
                "is_bestseller": True,
                "display_order": 1,
                "preparation_time": "15-20 mins",
                "tags": "pasta,italian,popular,creamy",
            },
            {
                "category_slug": "main-course",
                "name": "Grilled Ribeye Steak",
                "slug": "grilled-ribeye-steak",
                "short_description": "Prime Angus ribeye with truffle herb butter",
                "description": "12oz char-grilled prime Angus ribeye seasoned with sea salt and cracked pepper, basted with rosemary-garlic butter, served alongside roasted asparagus and mashed yukon gold potatoes.",
                "price": 28.00,
                "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
                "rating": 4.9,
                "review_count": 58,
                "is_available": True,
                "is_featured": True,
                "is_popular": True,
                "is_bestseller": True,
                "display_order": 2,
                "preparation_time": "20-25 mins",
                "tags": "steak,beef,grilled,premium",
            },
            {
                "category_slug": "main-course",
                "name": "Wood-Fired Margherita Pizza",
                "slug": "wood-fired-margherita-pizza",
                "short_description": "Artisan pizza with fresh basil, buffalo mozzarella & San Marzano tomatoes",
                "description": "Hand-stretched sourdough pizza crust baked in a 800-degree stone oven, topped with crushed San Marzano tomatoes, imported buffalo mozzarella, extra virgin olive oil, and fresh basil leaves.",
                "price": 16.00,
                "image_url": "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80",
                "rating": 4.7,
                "review_count": 39,
                "is_available": True,
                "is_featured": False,
                "is_popular": True,
                "is_bestseller": False,
                "display_order": 3,
                "preparation_time": "15 mins",
                "tags": "pizza,vegetarian,italian,wood-fired",
            },
            {
                "category_slug": "main-course",
                "name": "Gourmet Wagyu Burger",
                "slug": "gourmet-wagyu-burger",
                "short_description": "Brioche bun, melted aged cheddar, caramelized onion relish",
                "description": "Seared Wagyu beef patty on a toasted butter brioche bun with smoked bacon, aged cheddar, crisp butterhead lettuce, heirloom tomato, and house truffle aioli.",
                "price": 18.50,
                "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
                "rating": 4.8,
                "review_count": 64,
                "is_available": True,
                "is_featured": True,
                "is_popular": True,
                "is_bestseller": False,
                "display_order": 4,
                "preparation_time": "15-18 mins",
                "tags": "burger,beef,gourmet,chef-special",
            },
            {
                "category_slug": "starters",
                "name": "Healthy Quinoa Bowl",
                "slug": "healthy-quinoa-bowl",
                "short_description": "Organic red quinoa with avocado, edamame, and tahini drizzle",
                "description": "Nutrient-packed bowl featuring fluffy organic tri-color quinoa, hass avocado, steamed edamame, baby spinach, cherry tomatoes, and roasted chickpeas drizzled with lemon-herb tahini dressing.",
                "price": 11.00,
                "image_url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
                "rating": 4.6,
                "review_count": 29,
                "is_available": True,
                "is_featured": False,
                "is_popular": True,
                "is_bestseller": False,
                "display_order": 1,
                "preparation_time": "10-15 mins",
                "tags": "healthy,vegan,gluten-free,superfood",
            },
            {
                "category_slug": "starters",
                "name": "Crispy Calamari",
                "slug": "crispy-calamari",
                "short_description": "Tender golden fried squid rings with garlic aioli",
                "description": "Lightly dredged in seasoned semolina and quick-fried to golden perfection. Garnished with fresh parsley, lemon wedges, and house-made smoky paprika aioli.",
                "price": 12.00,
                "image_url": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
                "rating": 4.5,
                "review_count": 21,
                "is_available": True,
                "is_featured": False,
                "is_popular": False,
                "is_bestseller": False,
                "display_order": 2,
                "preparation_time": "10-12 mins",
                "tags": "seafood,starter,crispy",
            },
            {
                "category_slug": "desserts",
                "name": "Chocolate Lava Cake",
                "slug": "chocolate-lava-cake",
                "short_description": "Warm molten Belgian dark chocolate cake with vanilla bean gelato",
                "description": "Decadent dark chocolate soufflé cake with a warm flowing molten center, dusted with powdered sugar and served with artisanal Madagascar vanilla bean gelato and raspberry coulis.",
                "price": 8.50,
                "image_url": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
                "rating": 4.9,
                "review_count": 73,
                "is_available": True,
                "is_featured": True,
                "is_popular": True,
                "is_bestseller": True,
                "display_order": 1,
                "preparation_time": "12-15 mins",
                "tags": "dessert,chocolate,bestseller,sweet",
            },
            {
                "category_slug": "desserts",
                "name": "Artisanal Tiramisu",
                "slug": "artisanal-tiramisu",
                "short_description": "Classic Italian dessert with espresso-soaked ladyfingers & mascarpone",
                "description": "Traditional Venetian recipe made with Savoiardi ladyfingers soaked in dark roast espresso and Amaretto liqueur, layered with whipped mascarpone cream and dusted with Valrhona cocoa powder.",
                "price": 9.00,
                "image_url": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80",
                "rating": 4.8,
                "review_count": 45,
                "is_available": True,
                "is_featured": False,
                "is_popular": True,
                "is_bestseller": False,
                "display_order": 2,
                "preparation_time": "5 mins",
                "tags": "dessert,italian,coffee,sweet",
            },
            {
                "category_slug": "beverages",
                "name": "Fresh Orange Juice",
                "slug": "fresh-orange-juice",
                "short_description": "100% cold-pressed Valencia oranges served chilled",
                "description": "Pure, unpasteurized cold-pressed juice made from ripe sweet Valencia oranges. Free from added sugars, water, or preservatives.",
                "price": 5.00,
                "image_url": "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80",
                "rating": 4.7,
                "review_count": 34,
                "is_available": True,
                "is_featured": False,
                "is_popular": True,
                "is_bestseller": False,
                "display_order": 1,
                "preparation_time": "5 mins",
                "tags": "beverage,fresh,healthy,juice",
            },
            {
                "category_slug": "beverages",
                "name": "Wild Berry Mocktail",
                "slug": "wild-berry-mocktail",
                "short_description": "Muddled raspberries, blackberries, sparkling tonic & fresh mint",
                "description": "Refreshing craft mocktail prepared with hand-muddled organic wild berries, fresh lime juice, cane sugar syrup, artisanal sparkling water, and crushed ice.",
                "price": 6.50,
                "image_url": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80",
                "rating": 4.6,
                "review_count": 18,
                "is_available": True,
                "is_featured": False,
                "is_popular": False,
                "is_bestseller": False,
                "display_order": 2,
                "preparation_time": "5 mins",
                "tags": "beverage,mocktail,refreshing,berries",
            },
        ]

        item_map = {}
        for idata in menu_items_data:
            item = db.query(MenuItem).filter(MenuItem.slug == idata["slug"]).first()
            cat = cat_map.get(idata["category_slug"])
            if not item:
                item = MenuItem(
                    category_id=cat.id,
                    name=idata["name"],
                    slug=idata["slug"],
                    short_description=idata["short_description"],
                    description=idata["description"],
                    price=idata["price"],
                    image_url=idata["image_url"],
                    rating=idata["rating"],
                    review_count=idata["review_count"],
                    is_available=idata["is_available"],
                    is_featured=idata["is_featured"],
                    is_popular=idata["is_popular"],
                    is_bestseller=idata["is_bestseller"],
                    display_order=idata["display_order"],
                    preparation_time=idata["preparation_time"],
                    tags=idata["tags"],
                    is_active=True,
                )
                db.add(item)
                db.commit()
                db.refresh(item)
                print(f"  Created Menu Item: {item.name}")
            else:
                item.image_url = idata["image_url"]
                item.short_description = idata["short_description"]
                item.description = idata["description"]
                item.price = idata["price"]
                item.is_featured = idata["is_featured"]
                item.is_popular = idata["is_popular"]
                item.is_bestseller = idata["is_bestseller"]
                db.commit()
            item_map[item.slug] = item

        # 4. Staff Members
        staff_data = [
            {"name": "Alex Morgan", "code": "EMP-001", "designation": "Waiter", "rating": 4.8, "total": 45},
            {"name": "Sarah Jenkins", "code": "EMP-002", "designation": "Server", "rating": 4.9, "total": 52},
            {"name": "David Chen", "code": "EMP-003", "designation": "Head Server", "rating": 4.7, "total": 38},
            {"name": "Maria Rodriguez", "code": "EMP-004", "designation": "Room Service Staff", "rating": 4.8, "total": 29},
        ]

        staff_map = {}
        for sdata in staff_data:
            st = db.query(Staff).filter(Staff.employee_code == sdata["code"]).first()
            if not st:
                st = Staff(
                    name=sdata["name"],
                    employee_code=sdata["code"],
                    designation=sdata["designation"],
                    average_rating=sdata["rating"],
                    total_ratings=sdata["total"],
                    is_active=True,
                )
                db.add(st)
                db.commit()
                db.refresh(st)
                print(f"  Created Staff: {st.name} ({st.designation})")
            staff_map[st.employee_code] = st

        # 5. SINGLE UNIFIED QR CODE (Remove table-based locations)
        print("  Cleaning old multi-table locations and setting up 1 official QR Code...")
        qr_output_dir = os.path.join(settings.UPLOAD_DIR, "qrcodes")
        os.makedirs(qr_output_dir, exist_ok=True)

        # Deactivate or delete old locations like Table 01, Table 02, etc.
        old_tables = db.query(Location).filter(Location.qr_token != "main-menu").all()
        for ot in old_tables:
            ot.is_active = False

        # Find or create single Koottu Curry Restaurant location
        unified_token = "main-menu"
        main_loc = db.query(Location).filter(Location.qr_token == unified_token).first()
        if not main_loc:
            # Check if there was any location we can adapt
            main_loc = Location(
                name="Koottu Curry Restaurant",
                restaurant_name="Koottu Curry Restaurant",
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
            main_loc.restaurant_name = "Koottu Curry Restaurant"
            main_loc.location_type = "RESTAURANT"
            main_loc.table_number = None
            main_loc.room_number = None
            main_loc.is_active = True
            db.commit()

        qr_url = create_qr_code_image(unified_token, settings.FRONTEND_URL, qr_output_dir)

        # Ensure QRCode record exists
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

        # 6. Sample Banners with high-res food photography
        banners_data = [
            {
                "title": "Weekend Chef's Specials",
                "subtitle": "Fresh Flavors Every Friday & Saturday",
                "description": "Experience our master chef's seasonal creation paired with complimentary mocktails.",
                "image_url": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
                "button_text": "View Specials",
                "button_link": "/menu#specials",
                "display_order": 1,
            },
            {
                "title": "20% Off All Starters",
                "subtitle": "Happy Hours Daily 4 PM - 7 PM",
                "description": "Start your dining experience with delicious savings on crispy appetizers.",
                "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
                "button_text": "Explore Starters",
                "button_link": "/menu#starters",
                "display_order": 2,
            },
            {
                "title": "Artisanal Desserts & Sips",
                "subtitle": "Handcrafted Daily by Pastry Chefs",
                "description": "Indulge in warm molten lava cakes, classic tiramisu, and refreshing mocktails.",
                "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=80",
                "button_text": "Taste Sweets",
                "button_link": "/menu#desserts",
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

        # 7. Sample Reviews
        sample_reviews = [
            {
                "customer_name": "Emma Watson",
                "customer_identifier": "cust-demo-1",
                "review_type": "MENU_ITEM",
                "menu_item_id": item_map.get("creamy-alfredo-pasta").id if "creamy-alfredo-pasta" in item_map else None,
                "staff_id": None,
                "location_id": main_loc.id,
                "rating": 5,
                "review_text": "The Alfredo pasta was exceptionally rich and freshly prepared! Best in the city.",
            },
            {
                "customer_name": "James Smith",
                "customer_identifier": "cust-demo-2",
                "review_type": "STAFF",
                "menu_item_id": None,
                "staff_id": staff_map.get("EMP-001").id if "EMP-001" in staff_map else None,
                "location_id": main_loc.id,
                "rating": 5,
                "review_text": "Alex gave us prompt, polite, and very helpful service throughout dinner.",
            },
            {
                "customer_name": "Chloe Bennett",
                "customer_identifier": "cust-demo-3",
                "review_type": "RESTAURANT",
                "menu_item_id": None,
                "staff_id": None,
                "location_id": main_loc.id,
                "rating": 5,
                "review_text": "Wonderful ambiance and seamless QR code menu experience. Will visit again!",
            },
        ]

        for rdata in sample_reviews:
            rev = (
                db.query(Review)
                .filter(Review.customer_identifier == rdata["customer_identifier"])
                .first()
            )
            if not rev:
                rev = Review(
                    customer_name=rdata["customer_name"],
                    customer_identifier=rdata["customer_identifier"],
                    review_type=rdata["review_type"],
                    menu_item_id=rdata["menu_item_id"],
                    staff_id=rdata["staff_id"],
                    location_id=rdata["location_id"],
                    rating=rdata["rating"],
                    review_text=rdata["review_text"],
                    is_approved=True,
                    is_visible=True,
                )
                db.add(rev)
                db.commit()
                print(f"  Created Sample Review by: {rev.customer_name}")
            else:
                rev.location_id = main_loc.id
                db.commit()

        print("\nUnified database seeding completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
