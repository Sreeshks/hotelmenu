import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.admin import Admin
from app.models.menu_item import MenuItem
from app.models.category import Category
from app.schemas.common import ApiResponse
from app.schemas.menu_item import MenuItemResponse
from app.services.realtime_service import manager
import re

router = APIRouter(prefix="/offers", tags=["Offers & Combos"])


class DailyOfferUpdateRequest(BaseModel):
    item_id: int
    offer_days: List[str]  # e.g. ["Monday", "Wednesday"]
    offer_price: float = Field(..., ge=0.0)
    original_price: Optional[float] = Field(None, ge=0.0)


class ComboOfferCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    category_id: int
    price: float = Field(..., ge=0.0)
    original_price: Optional[float] = Field(None, ge=0.0)
    combo_items: List[Dict[str, Any]] = Field(default_factory=list)
    image_url: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    offer_days: Optional[List[str]] = None
    is_vegetarian: bool = False


@router.get(
    "/daily",
    response_model=ApiResponse[List[MenuItemResponse]],
    summary="Get Daily Offers",
    description="Returns all menu items configured as daily offers. Optionally filter by day of week (e.g. Monday).",
)
def get_daily_offers(
    day: Optional[str] = Query(None, description="Day of week (Monday, Tuesday, etc.)"),
    db: Session = Depends(get_db),
):
    query = db.query(MenuItem).filter(
        MenuItem.is_active == True,
        MenuItem.is_daily_offer == True,
    )

    items = query.all()
    results: List[MenuItemResponse] = []

    target_day = day.strip().lower() if day else None

    for item in items:
        if target_day:
            days_str = (item.offer_days or "").lower()
            day_list = [d.strip() for d in days_str.split(",") if d.strip()]
            if not day_list or "all" in day_list or "daily" in day_list or target_day in day_list:
                resp = MenuItemResponse.model_validate(item)
                resp.category_name = item.category.name if item.category else None
                results.append(resp)
        else:
            resp = MenuItemResponse.model_validate(item)
            resp.category_name = item.category.name if item.category else None
            results.append(resp)

    return ApiResponse(
        success=True,
        message=f"Found {len(results)} daily offer items",
        data=results,
    )


@router.get(
    "/combos",
    response_model=ApiResponse[List[MenuItemResponse]],
    summary="Get Combo Deals",
    description="Returns all combo packages in the menu.",
)
def get_combo_offers(
    db: Session = Depends(get_db),
):
    items = db.query(MenuItem).filter(
        MenuItem.is_active == True,
        MenuItem.is_combo == True,
    ).order_by(MenuItem.display_order.asc(), MenuItem.created_at.desc()).all()

    results: List[MenuItemResponse] = []
    for item in items:
        resp = MenuItemResponse.model_validate(item)
        resp.category_name = item.category.name if item.category else None
        results.append(resp)

    return ApiResponse(
        success=True,
        message=f"Found {len(results)} combo offers",
        data=results,
    )


@router.post(
    "/daily",
    response_model=ApiResponse[MenuItemResponse],
    summary="Configure Daily Offer on Dish (Admin)",
    description="Sets day-of-week schedule and offer price on a dish.",
)
async def set_daily_offer(
    payload: DailyOfferUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    item = db.query(MenuItem).filter(MenuItem.id == payload.item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")

    # If original price is not explicitly set, preserve current price as regular price
    orig_price = payload.original_price or item.original_price or item.price
    if orig_price <= payload.offer_price:
        orig_price = item.price if item.price > payload.offer_price else payload.offer_price

    item.is_daily_offer = True
    item.offer_days = ",".join([d.strip() for d in payload.offer_days if d.strip()])
    item.original_price = orig_price
    item.price = payload.offer_price

    db.commit()
    db.refresh(item)
    manager.increment_menu_version(db)
    try:
        await manager.broadcast("MENU_UPDATED", {"action": "daily_offer_updated", "item_id": item.id})
    except Exception:
        pass

    resp = MenuItemResponse.model_validate(item)
    resp.category_name = item.category.name if item.category else None
    return ApiResponse(success=True, message="Daily offer configured successfully", data=resp)


@router.delete(
    "/daily/{item_id}",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Remove Daily Offer from Dish (Admin)",
    description="Removes day-of-the-week offer from a dish and restores regular price.",
)
async def remove_daily_offer(
    item_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")

    # Restore regular price from original_price if it existed
    if item.original_price and item.original_price > item.price:
        item.price = item.original_price
        item.original_price = None

    item.is_daily_offer = False
    item.offer_days = None

    db.commit()
    manager.increment_menu_version(db)
    try:
        await manager.broadcast("MENU_UPDATED", {"action": "daily_offer_removed", "item_id": item_id})
    except Exception:
        pass

    return ApiResponse(success=True, message="Daily offer removed successfully", data={"item_id": item_id})


@router.post(
    "/combo",
    response_model=ApiResponse[MenuItemResponse],
    summary="Create Combo Deal (Admin)",
    description="Bundles selected existing menu items into a new combo offer package.",
)
async def create_combo_offer(
    payload: ComboOfferCreateRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    # Verify category exists
    cat = db.query(Category).filter(Category.id == payload.category_id).first()
    if not cat:
        # Default to first active category if not found
        cat = db.query(Category).filter(Category.is_active == True).first()
        if not cat:
            raise HTTPException(status_code=400, detail="No category found for combo package")

    # Generate unique slug
    base_slug = re.sub(r"[^\w\s-]", "", payload.name.lower())
    base_slug = re.sub(r"[\s_-]+", "-", base_slug).strip("-")
    slug = base_slug
    counter = 1
    while db.query(MenuItem).filter(MenuItem.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    combo_items_json = json.dumps(payload.combo_items, ensure_ascii=False) if payload.combo_items else None
    offer_days_str = ",".join(payload.offer_days) if payload.offer_days else None

    # Calculate fallback original_price if not provided
    orig_price = payload.original_price
    if not orig_price and payload.combo_items:
        orig_price = sum(float(ci.get("price", 0)) * int(ci.get("quantity", 1)) for ci in payload.combo_items)

    combo = MenuItem(
        category_id=cat.id,
        name=payload.name,
        slug=slug,
        short_description=payload.short_description or f"Combo includes {len(payload.combo_items)} selected dishes",
        description=payload.description or "Value meal combo bundle prepared fresh to order.",
        price=payload.price,
        original_price=orig_price,
        is_combo=True,
        combo_items=combo_items_json,
        is_daily_offer=bool(offer_days_str),
        offer_days=offer_days_str,
        image_url=payload.image_url or (payload.combo_items[0].get("image_url") if payload.combo_items else None),
        is_available=True,
        is_featured=True,
        is_vegetarian=payload.is_vegetarian,
        tags="Combo, Value Deal",
        is_active=True,
    )

    db.add(combo)
    db.commit()
    db.refresh(combo)
    manager.increment_menu_version(db)
    try:
        await manager.broadcast("MENU_UPDATED", {"action": "combo_created", "item_id": combo.id})
    except Exception:
        pass

    resp = MenuItemResponse.model_validate(combo)
    resp.category_name = cat.name
    return ApiResponse(success=True, message="Combo deal created successfully", data=resp)
