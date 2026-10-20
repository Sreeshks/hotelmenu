import json
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from app.schemas.category import CategoryResponse
from app.schemas.review import ReviewResponse


class MenuItemBase(BaseModel):
    category_id: int
    name: str = Field(..., min_length=1, max_length=150)
    short_description: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    price: float = Field(..., ge=0.0)
    original_price: Optional[float] = Field(None, ge=0.0)
    is_combo: bool = False
    combo_items: Optional[str] = None
    image_url: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    is_available: bool = True
    is_featured: bool = False
    is_popular: bool = False
    is_bestseller: bool = False
    display_order: int = Field(default=0, ge=0)
    preparation_time: Optional[str] = Field(None, max_length=50)
    tags: Optional[str] = Field(None, max_length=255)


class MenuItemCreate(MenuItemBase):
    slug: Optional[str] = None


class MenuItemUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    slug: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    price: Optional[float] = Field(None, ge=0.0)
    original_price: Optional[float] = Field(None, ge=0.0)
    is_combo: Optional[bool] = None
    combo_items: Optional[str] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = None
    is_available: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_popular: Optional[bool] = None
    is_bestseller: Optional[bool] = None
    display_order: Optional[int] = Field(None, ge=0)
    preparation_time: Optional[str] = Field(None, max_length=50)
    tags: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None


class MenuItemAvailabilityUpdate(BaseModel):
    is_available: bool


class MenuItemResponse(MenuItemBase):
    id: int
    slug: str
    rating: float = 0.0
    review_count: int = 0
    is_active: bool = True
    category_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @field_validator("images", mode="before")
    @classmethod
    def parse_images(cls, v: Any) -> List[str]:
        if isinstance(v, list):
            return [str(u) for u in v if u]
        if isinstance(v, str) and v.strip():
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(u) for u in parsed if u]
            except Exception:
                pass
        return []

    @model_validator(mode="after")
    def sync_image_fields(self) -> "MenuItemResponse":
        # If images list is empty but image_url exists, populate images
        if not self.images and self.image_url:
            self.images = [self.image_url]
        # If image_url is empty but images has items, use first as image_url
        elif self.images and not self.image_url:
            self.image_url = self.images[0]
        return self

    model_config = ConfigDict(from_attributes=True)


class MenuItemDetailResponse(MenuItemResponse):
    category: Optional[CategoryResponse] = None
    reviews: List[ReviewResponse] = []


class ImageSearchResult(BaseModel):
    url: str
    thumb_url: Optional[str] = None
    title: Optional[str] = None
    source: Optional[str] = None


class ImageSearchResponse(BaseModel):
    query: str
    count: int
    results: List[ImageSearchResult]
