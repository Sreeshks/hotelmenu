from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from app.models.category import Category
from app.models.menu_item import MenuItem
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryReorderItem
from app.schemas.menu_item import MenuItemCreate, MenuItemUpdate, MenuItemAvailabilityUpdate
from app.schemas.customer_menu import CustomerMenuResponse, CustomerLocationInfo
from app.schemas.category import CategoryResponse
from app.schemas.menu_item import MenuItemResponse
from app.schemas.banner import BannerResponse
from app.repositories.category_repository import CategoryRepository
from app.repositories.menu_item_repository import MenuItemRepository
from app.repositories.banner_repository import BannerRepository
from app.repositories.location_repository import LocationRepository
from app.services.realtime_service import manager
from app.core.exceptions import NotFoundError, ConflictError
from app.utils.slug import slugify


class MenuService:
    def __init__(self, db: Session):
        self.db = db
        self.category_repo = CategoryRepository(db)
        self.menu_item_repo = MenuItemRepository(db)
        self.banner_repo = BannerRepository(db)
        self.location_repo = LocationRepository(db)

    # ------------------ CATEGORIES ------------------

    def create_category(self, data: CategoryCreate) -> Category:
        slug = data.slug or slugify(data.name)
        existing = self.category_repo.get_by_slug(slug)
        if existing:
            slug = f"{slug}-{self.category_repo.count() + 1}"

        category = Category(
            name=data.name,
            slug=slug,
            description=data.description,
            icon=data.icon,
            image=data.image,
            display_order=data.display_order,
            is_active=data.is_active,
        )
        created = self.category_repo.create(category)
        manager.increment_menu_version(self.db)
        return created

    def update_category(self, id: int, data: CategoryUpdate) -> Category:
        category = self.category_repo.get_by_id(id)
        if not category:
            raise NotFoundError("Category not found", error_code="CATEGORY_NOT_FOUND")

        update_data = data.model_dump(exclude_unset=True)
        if "name" in update_data and not update_data.get("slug"):
            update_data["slug"] = slugify(update_data["name"])

        for field, value in update_data.items():
            setattr(category, field, value)

        updated = self.category_repo.update(category)
        manager.increment_menu_version(self.db)
        return updated

    def set_category_status(self, id: int, is_active: bool) -> Category:
        category = self.category_repo.get_by_id(id)
        if not category:
            raise NotFoundError("Category not found", error_code="CATEGORY_NOT_FOUND")

        category.is_active = is_active
        updated = self.category_repo.update(category)
        manager.increment_menu_version(self.db)
        return updated

    def reorder_categories(self, items: List[CategoryReorderItem]) -> None:
        reorder_list = [{"id": item.id, "display_order": item.display_order} for item in items]
        self.category_repo.reorder(reorder_list)
        manager.increment_menu_version(self.db)

    def delete_category(self, id: int, hard: bool = False) -> None:
        category = self.category_repo.get_by_id(id)
        if not category:
            raise NotFoundError("Category not found", error_code="CATEGORY_NOT_FOUND")

        if hard:
            self.category_repo.delete(category)
        else:
            category.is_active = False
            self.category_repo.update(category)
        manager.increment_menu_version(self.db)

    # ------------------ MENU ITEMS ------------------

    def create_menu_item(self, data: MenuItemCreate) -> MenuItem:
        # Validate category exists
        cat = self.category_repo.get_by_id(data.category_id)
        if not cat:
            raise NotFoundError("Category does not exist", error_code="CATEGORY_NOT_FOUND")

        slug = data.slug or slugify(data.name)
        existing = self.menu_item_repo.get_by_slug(slug)
        if existing:
            slug = f"{slug}-{self.menu_item_repo.count() + 1}"

        item = MenuItem(
            category_id=data.category_id,
            name=data.name,
            slug=slug,
            short_description=data.short_description,
            description=data.description,
            price=data.price,
            image_url=data.image_url,
            is_available=data.is_available,
            is_featured=data.is_featured,
            is_popular=data.is_popular,
            is_bestseller=data.is_bestseller,
            display_order=data.display_order,
            preparation_time=data.preparation_time,
            tags=data.tags,
            is_active=True,
        )
        created = self.menu_item_repo.create(item)
        manager.increment_menu_version(self.db)
        return created

    def update_menu_item(self, id: int, data: MenuItemUpdate) -> MenuItem:
        item = self.menu_item_repo.get_by_id(id)
        if not item:
            raise NotFoundError("Menu item not found", error_code="MENU_ITEM_NOT_FOUND")

        update_data = data.model_dump(exclude_unset=True)
        if "category_id" in update_data:
            cat = self.category_repo.get_by_id(update_data["category_id"])
            if not cat:
                raise NotFoundError("Category does not exist", error_code="CATEGORY_NOT_FOUND")

        if "name" in update_data and not update_data.get("slug"):
            update_data["slug"] = slugify(update_data["name"])

        for field, value in update_data.items():
            setattr(item, field, value)

        updated = self.menu_item_repo.update(item)
        manager.increment_menu_version(self.db)
        return updated

    async def update_availability(self, id: int, is_available: bool) -> MenuItem:
        """
        Extremely important live stock flow:
        1. Update database
        2. Commit transaction
        3. Increment menu version
        4. Broadcast WebSocket event to all connected customer clients
        5. Return updated item
        """
        item = self.menu_item_repo.get_by_id(id)
        if not item:
            raise NotFoundError("Menu item not found", error_code="MENU_ITEM_NOT_FOUND")

        item.is_available = is_available
        updated = self.menu_item_repo.update(item)
        manager.increment_menu_version(self.db)

        # Broadcast live availability change
        await manager.broadcast(
            event="MENU_ITEM_AVAILABILITY_CHANGED",
            data={
                "menu_item_id": updated.id,
                "name": updated.name,
                "is_available": updated.is_available,
            },
        )
        return updated

    def delete_menu_item(self, id: int, hard: bool = False) -> None:
        item = self.menu_item_repo.get_by_id(id)
        if not item:
            raise NotFoundError("Menu item not found", error_code="MENU_ITEM_NOT_FOUND")

        if hard:
            self.menu_item_repo.delete(item)
        else:
            item.is_active = False
            self.menu_item_repo.update(item)
        manager.increment_menu_version(self.db)

    # ------------------ CUSTOMER MENU RETRIEVAL ------------------

    def get_customer_menu(self, qr_token: str) -> CustomerMenuResponse:
        location = self.location_repo.get_by_qr_token(qr_token)
        if not location:
            location = self.location_repo.get_default_location()

        if not location:
            raise NotFoundError(
                "Menu is currently unavailable",
                error_code="LOCATION_NOT_FOUND",
            )

        categories = self.category_repo.get_active_categories()
        banners = self.banner_repo.get_active_banners()
        items, _ = self.menu_item_repo.filter_items(is_active=True, limit=500)

        location_info = CustomerLocationInfo(
            id=location.id,
            name=location.name,
            type=location.location_type,
            table_number=location.table_number,
            room_number=location.room_number,
            # Expose the restaurant/location name so the frontend can display
            # it dynamically without relying on hardcoded fallback constants.
            restaurant_name=location.name,
        )

        cat_responses = [
            CategoryResponse.model_validate(c) for c in categories
        ]
        banner_responses = [
            BannerResponse.model_validate(b) for b in banners
        ]

        item_responses: List[MenuItemResponse] = []
        featured_responses: List[MenuItemResponse] = []
        popular_responses: List[MenuItemResponse] = []
        bestseller_responses: List[MenuItemResponse] = []

        for item in items:
            resp = MenuItemResponse.model_validate(item)
            resp.category_name = item.category.name if item.category else None
            item_responses.append(resp)
            if item.is_featured:
                featured_responses.append(resp)
            if item.is_popular:
                popular_responses.append(resp)
            if item.is_bestseller:
                bestseller_responses.append(resp)

        return CustomerMenuResponse(
            location=location_info,
            categories=cat_responses,
            banners=banner_responses,
            menu_items=item_responses,
            featured_items=featured_responses,
            popular_items=popular_responses,
            bestsellers=bestseller_responses,
        )
