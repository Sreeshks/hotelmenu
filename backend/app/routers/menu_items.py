from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.admin import Admin
from app.schemas.menu_item import (
    MenuItemCreate,
    MenuItemUpdate,
    MenuItemAvailabilityUpdate,
    MenuItemResponse,
    MenuItemDetailResponse,
    ImageSearchResponse,
    ImageSearchResult,
)
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.schemas.category import CategoryResponse
from app.schemas.review import ReviewResponse
from app.services.menu_service import MenuService
from app.services.upload_service import upload_service
from app.core.exceptions import NotFoundError

public_router = APIRouter(prefix="/menu-items", tags=["Menu Items"])
admin_router = APIRouter(prefix="/admin/menu-items", tags=["Admin Menu Items"])


# ------------------ PUBLIC ENDPOINTS ------------------

@public_router.get(
    "",
    response_model=PaginatedResponse[MenuItemResponse],
    summary="Get Menu Items (Customer)",
    description="Lists active menu items with search, filters, sorting, and pagination.",
)
def get_menu_items(
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    search: Optional[str] = Query(None, description="Search term for name, description, tags"),
    is_available: Optional[bool] = Query(None, description="Filter by availability"),
    is_featured: Optional[bool] = Query(None, description="Filter featured items"),
    is_popular: Optional[bool] = Query(None, description="Filter popular items"),
    is_bestseller: Optional[bool] = Query(None, description="Filter bestsellers"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    sort_by: Optional[str] = Query(
        "display_order",
        pattern="^(display_order|price_low_to_high|price_high_to_low|rating|popularity)$",
    ),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    service = MenuService(db)
    skip = (page - 1) * limit
    items, total = service.menu_item_repo.filter_items(
        category_id=category_id,
        search=search,
        is_available=is_available,
        is_featured=is_featured,
        is_popular=is_popular,
        is_bestseller=is_bestseller,
        min_price=min_price,
        max_price=max_price,
        is_active=True,
        sort_by=sort_by,
        skip=skip,
        limit=limit,
    )

    data = []
    for item in items:
        resp = MenuItemResponse.model_validate(item)
        resp.category_name = item.category.name if item.category else None
        data.append(resp)

    total_pages = (total + limit - 1) // limit if total > 0 else 0
    return PaginatedResponse(
        success=True,
        message="Menu items retrieved successfully",
        data=data,
        pagination=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages),
    )


@public_router.get(
    "/{id_or_slug}",
    response_model=ApiResponse[MenuItemDetailResponse],
    summary="Get Menu Item Details (Customer)",
    description="Retrieves a single menu item by ID or slug with category and reviews.",
)
def get_menu_item_detail(id_or_slug: str, db: Session = Depends(get_db)):
    service = MenuService(db)
    if id_or_slug.isdigit():
        item = service.menu_item_repo.get_with_details(int(id_or_slug))
    else:
        item = service.menu_item_repo.get_by_slug(id_or_slug)

    if not item or not item.is_active:
        raise NotFoundError("Menu item not found", error_code="MENU_ITEM_NOT_FOUND")

    visible_reviews = [
        ReviewResponse(
            id=r.id,
            customer_name=r.customer_name,
            customer_identifier=r.customer_identifier,
            review_type=r.review_type,
            menu_item_id=r.menu_item_id,
            staff_id=r.staff_id,
            location_id=r.location_id,
            rating=r.rating,
            review_text=r.review_text,
            is_approved=r.is_approved,
            is_visible=r.is_visible,
            created_at=r.created_at,
            updated_at=r.updated_at,
            images=[],
        )
        for r in (item.reviews or [])
        if r.is_visible and r.is_approved
    ]

    resp = MenuItemDetailResponse(
        id=item.id,
        category_id=item.category_id,
        name=item.name,
        slug=item.slug,
        short_description=item.short_description,
        description=item.description,
        price=item.price,
        image_url=item.image_url,
        rating=item.rating,
        review_count=item.review_count,
        is_available=item.is_available,
        is_featured=item.is_featured,
        is_popular=item.is_popular,
        is_bestseller=item.is_bestseller,
        display_order=item.display_order,
        preparation_time=item.preparation_time,
        tags=item.tags,
        is_active=item.is_active,
        category_name=item.category.name if item.category else None,
        created_at=item.created_at,
        updated_at=item.updated_at,
        category=CategoryResponse.model_validate(item.category) if item.category else None,
        reviews=visible_reviews,
    )
    return ApiResponse(success=True, message="Menu item fetched successfully", data=resp)


# ------------------ ADMIN ENDPOINTS ------------------

@admin_router.get(
    "",
    response_model=PaginatedResponse[MenuItemResponse],
    summary="List Menu Items (Admin)",
    description="Retrieves menu items with filters and pagination for administrative management.",
)
def admin_list_menu_items(
    category_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    is_available: Optional[bool] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = MenuService(db)
    skip = (page - 1) * limit
    items, total = service.menu_item_repo.filter_items(
        category_id=category_id,
        search=search,
        is_available=is_available,
        is_active=is_active,
        skip=skip,
        limit=limit,
    )

    data = []
    for item in items:
        resp = MenuItemResponse.model_validate(item)
        resp.category_name = item.category.name if item.category else None
        data.append(resp)

    total_pages = (total + limit - 1) // limit if total > 0 else 0
    return PaginatedResponse(
        success=True,
        message="Admin menu items retrieved successfully",
        data=data,
        pagination=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages),
    )


@admin_router.get(
    "/search-images",
    response_model=ApiResponse[ImageSearchResponse],
    summary="Search Images for Menu Item (Admin)",
    description="Searches high-quality web/Google images for a dish name or product keyword.",
)
def admin_search_images(
    q: str = Query(..., min_length=1, description="Dish name or product search query"),
    limit: int = Query(24, ge=1, le=50, description="Maximum images to retrieve"),
    current_admin: Admin = Depends(get_current_admin),
):
    from app.services.image_search_service import image_search_service
    results = image_search_service.search_images(query=q, limit=limit)
    response_data = ImageSearchResponse(
        query=q,
        count=len(results),
        results=[ImageSearchResult(**r) for r in results],
    )
    return ApiResponse(
        success=True,
        message=f"Found {len(results)} images for '{q}'",
        data=response_data,
    )


@admin_router.get(
    "/{id}",
    response_model=ApiResponse[MenuItemResponse],
    summary="Get Menu Item by ID (Admin)",
    description="Retrieves a single menu item by ID.",
)
def admin_get_menu_item(
    id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = MenuService(db)
    item = service.menu_item_repo.get_with_details(id)
    if not item:
        raise NotFoundError("Menu item not found", error_code="MENU_ITEM_NOT_FOUND")

    resp = MenuItemResponse.model_validate(item)
    resp.category_name = item.category.name if item.category else None
    return ApiResponse(success=True, message="Menu item retrieved successfully", data=resp)


@admin_router.post(
    "",
    response_model=ApiResponse[MenuItemResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create Menu Item (Admin)",
    description="Creates a new menu item.",
)
def admin_create_menu_item(
    data: MenuItemCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = MenuService(db)
    item = service.create_menu_item(data)
    resp = MenuItemResponse.model_validate(item)
    return ApiResponse(success=True, message="Menu item created successfully", data=resp)


@admin_router.put(
    "/{id}",
    response_model=ApiResponse[MenuItemResponse],
    summary="Update Menu Item (Admin)",
    description="Updates existing menu item details.",
)
def admin_update_menu_item(
    id: int,
    data: MenuItemUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = MenuService(db)
    item = service.update_menu_item(id, data)
    resp = MenuItemResponse.model_validate(item)
    return ApiResponse(success=True, message="Menu item updated successfully", data=resp)


@admin_router.patch(
    "/{id}/availability",
    response_model=ApiResponse[MenuItemResponse],
    summary="Update Menu Item Live Availability (Admin)",
    description="Updates stock availability and instantly broadcasts real-time WebSocket event to all connected customer clients.",
)
async def admin_update_availability(
    id: int,
    data: MenuItemAvailabilityUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = MenuService(db)
    item = await service.update_availability(id, data.is_available)
    resp = MenuItemResponse.model_validate(item)
    return ApiResponse(
        success=True,
        message=f"Menu item marked {'AVAILABLE' if data.is_available else 'OUT OF STOCK'}",
        data=resp,
    )


@admin_router.delete(
    "/{id}",
    response_model=ApiResponse[None],
    summary="Delete Menu Item (Admin)",
    description="Deletes a menu item permanently from the database.",
)
def admin_delete_menu_item(
    id: int,
    hard: bool = True,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = MenuService(db)
    service.delete_menu_item(id, hard=hard)
    return ApiResponse(success=True, message="Menu item deleted successfully")


@admin_router.post(
    "/{id}/image",
    response_model=ApiResponse[MenuItemResponse],
    summary="Upload Menu Item Image (Admin)",
    description="Uploads and updates the image for a menu item.",
)
async def admin_upload_menu_item_image(
    id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = MenuService(db)
    item = service.menu_item_repo.get_by_id(id)
    if not item:
        raise NotFoundError("Menu item not found", error_code="MENU_ITEM_NOT_FOUND")

    image_url = await upload_service.upload_image(file, subfolder="menu_items")
    item.image_url = image_url
    service.menu_item_repo.update(item)

    resp = MenuItemResponse.model_validate(item)
    return ApiResponse(success=True, message="Menu item image uploaded successfully", data=resp)
