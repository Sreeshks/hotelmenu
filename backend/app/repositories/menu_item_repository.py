from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from app.models.menu_item import MenuItem
from app.models.category import Category
from app.repositories.base import BaseRepository


class MenuItemRepository(BaseRepository[MenuItem]):
    def __init__(self, db: Session):
        super().__init__(MenuItem, db)

    def get_by_slug(self, slug: str) -> Optional[MenuItem]:
        return (
            self.db.query(MenuItem)
            .options(joinedload(MenuItem.category))
            .filter(MenuItem.slug == slug)
            .first()
        )

    def get_with_details(self, id: int) -> Optional[MenuItem]:
        return (
            self.db.query(MenuItem)
            .options(joinedload(MenuItem.category))
            .filter(MenuItem.id == id)
            .first()
        )

    def filter_items(
        self,
        category_id: Optional[int] = None,
        search: Optional[str] = None,
        is_available: Optional[bool] = None,
        is_featured: Optional[bool] = None,
        is_popular: Optional[bool] = None,
        is_bestseller: Optional[bool] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        is_active: Optional[bool] = True,
        sort_by: Optional[str] = "display_order",
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[List[MenuItem], int]:
        query = self.db.query(MenuItem).options(joinedload(MenuItem.category))

        if is_active is not None:
            query = query.filter(MenuItem.is_active == is_active)

        if category_id is not None:
            query = query.filter(MenuItem.category_id == category_id)

        if is_available is not None:
            query = query.filter(MenuItem.is_available == is_available)

        if is_featured is not None:
            query = query.filter(MenuItem.is_featured == is_featured)

        if is_popular is not None:
            query = query.filter(MenuItem.is_popular == is_popular)

        if is_bestseller is not None:
            query = query.filter(MenuItem.is_bestseller == is_bestseller)

        if min_price is not None:
            query = query.filter(MenuItem.price >= min_price)

        if max_price is not None:
            query = query.filter(MenuItem.price <= max_price)

        if search:
            search_term = f"%{search.strip().lower()}%"
            query = query.outerjoin(Category, MenuItem.category_id == Category.id).filter(
                or_(
                    func.lower(MenuItem.name).like(search_term),
                    func.lower(MenuItem.description).like(search_term),
                    func.lower(MenuItem.short_description).like(search_term),
                    func.lower(MenuItem.tags).like(search_term),
                    func.lower(Category.name).like(search_term),
                )
            )

        # Count total matches before pagination
        total = query.count()

        # Sorting logic
        if sort_by == "price_low_to_high":
            query = query.order_by(MenuItem.price.asc())
        elif sort_by == "price_high_to_low":
            query = query.order_by(MenuItem.price.desc())
        elif sort_by == "rating":
            query = query.order_by(MenuItem.rating.desc(), MenuItem.review_count.desc())
        elif sort_by == "popularity":
            query = query.order_by(MenuItem.is_popular.desc(), MenuItem.review_count.desc())
        else:
            query = query.order_by(MenuItem.display_order.asc(), MenuItem.name.asc())

        items = query.offset(skip).limit(limit).all()
        return items, total

    def count_available(self) -> int:
        return self.db.query(MenuItem).filter(MenuItem.is_active == True, MenuItem.is_available == True).count()

    def count_out_of_stock(self) -> int:
        return self.db.query(MenuItem).filter(MenuItem.is_active == True, MenuItem.is_available == False).count()
