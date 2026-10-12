from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.menu_service import MenuService
from app.schemas.customer_menu import CustomerMenuResponse, MenuVersionResponse
from app.schemas.menu_item import MenuItemResponse
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.models.menu_version import MenuVersion

router = APIRouter(prefix="/menu", tags=["Customer Menu"])


@router.get(
    "/search",
    response_model=PaginatedResponse[MenuItemResponse],
    summary="Search Dishes / Menu Items",
    description="Search active menu items using case-insensitive LIKE pattern matching across dish name, description, tags, and category name.",
)
def search_dishes(
    search: Optional[str] = Query(None, description="Search keyword for dishes"),
    q: Optional[str] = Query(None, description="Alias for search query keyword"),
    category_id: Optional[int] = Query(None, description="Optional category ID filter"),
    is_available: Optional[bool] = Query(None, description="Optional availability filter"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    keyword = (search or q or "").strip()
    service = MenuService(db)
    skip = (page - 1) * limit
    items, total = service.menu_item_repo.filter_items(
        category_id=category_id,
        search=keyword if keyword else None,
        is_available=is_available,
        is_active=True,
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
        message=f"Found {total} dishes matching '{keyword}'" if keyword else f"Retrieved {total} dishes",
        data=data,
        pagination=PaginationMeta(
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
        ),
    )


@router.get(
    "/{qr_token}/search",
    response_model=PaginatedResponse[MenuItemResponse],
    summary="Search Menu Items by QR Token",
    description="Search active dishes using case-insensitive LIKE matching within the QR location context.",
)
def search_dishes_by_token(
    qr_token: str,
    search: Optional[str] = Query(None, description="Search keyword for dishes"),
    q: Optional[str] = Query(None, description="Alias for search query keyword"),
    category_id: Optional[int] = Query(None, description="Optional category ID filter"),
    is_available: Optional[bool] = Query(None, description="Optional availability filter"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return search_dishes(
        search=search,
        q=q,
        category_id=category_id,
        is_available=is_available,
        page=page,
        limit=limit,
        db=db,
    )


@router.get(
    "/{qr_token}",
    response_model=CustomerMenuResponse,
    summary="Get Digital Menu by QR Token",
    description="Fetches the full digital menu (location info, categories, banners, items, specials) using a QR code token without authentication.",
)
def get_customer_menu(qr_token: str, db: Session = Depends(get_db)):
    service = MenuService(db)
    return service.get_customer_menu(qr_token)


@router.get(
    "/{qr_token}/version",
    response_model=MenuVersionResponse,
    summary="Poll Menu Version",
    description="Returns current menu version number for fallback polling when WebSockets are unavailable.",
)
def get_menu_version(qr_token: str, db: Session = Depends(get_db)):
    record = db.query(MenuVersion).filter(MenuVersion.key == "global").first()
    version = record.version if record else 1
    return MenuVersionResponse(version=version)
