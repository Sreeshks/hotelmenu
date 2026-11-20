from typing import List, Optional
from pydantic import BaseModel
from app.schemas.location import CustomerLocationInfo
from app.schemas.category import CategoryResponse
from app.schemas.banner import BannerResponse
from app.schemas.menu_item import MenuItemResponse


class CustomerMenuResponse(BaseModel):
    location: CustomerLocationInfo
    categories: List[CategoryResponse] = []
    banners: List[BannerResponse] = []
    menu_items: List[MenuItemResponse] = []
    featured_items: List[MenuItemResponse] = []
    popular_items: List[MenuItemResponse] = []
    bestsellers: List[MenuItemResponse] = []
    today_offers: List[MenuItemResponse] = []
    combo_offers: List[MenuItemResponse] = []
    today_day_name: str = ""


class MenuVersionResponse(BaseModel):
    version: int
