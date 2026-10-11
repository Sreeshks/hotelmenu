from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.admin import Admin
from app.models.category import Category
from app.schemas.category import (
    CategoryCreate,
    CategoryUpdate,
    CategoryStatusUpdate,
    CategoryReorderItem,
    CategoryResponse,
)
from app.schemas.common import ApiResponse
from app.services.menu_service import MenuService
from app.services.upload_service import upload_service
from app.core.exceptions import NotFoundError

public_router = APIRouter(prefix="/categories", tags=["Categories"])
admin_router = APIRouter(prefix="/admin/categories", tags=["Admin Categories"])


# ------------------ PUBLIC ENDPOINTS ------------------

@public_router.get(
    "",
    response_model=ApiResponse[List[CategoryResponse]],
    summary="Get Active Categories",
    description="Returns all active menu categories ordered by display order for customer view.",
)
def get_active_categories(db: Session = Depends(get_db)):
    service = MenuService(db)
    cats = service.category_repo.get_active_categories()
    data = []
    for c in cats:
        resp = CategoryResponse.model_validate(c)
        resp.item_count = service.category_repo.get_item_count(c.id)
        data.append(resp)
    return ApiResponse(success=True, message="Categories fetched successfully", data=data)


# ------------------ ADMIN ENDPOINTS ------------------

@admin_router.get(
    "",
    response_model=ApiResponse[List[CategoryResponse]],
    summary="List All Categories (Admin)",
    description="Lists all categories including inactive ones for administrative management.",
)
def admin_list_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = MenuService(db)
    cats = service.category_repo.get_all_admin(skip=skip, limit=limit)
    data = []
    for c in cats:
        resp = CategoryResponse.model_validate(c)
        resp.item_count = service.category_repo.get_item_count(c.id)
        data.append(resp)
    return ApiResponse(success=True, message="Categories retrieved successfully", data=data)


@admin_router.get(
    "/{id}",
    response_model=ApiResponse[CategoryResponse],
    summary="Get Category by ID (Admin)",
    description="Retrieves category details by ID.",
)
def admin_get_category(
    id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = MenuService(db)
    cat = service.category_repo.get_by_id(id)
    if not cat:
        raise NotFoundError("Category not found", error_code="CATEGORY_NOT_FOUND")
    resp = CategoryResponse.model_validate(cat)
    resp.item_count = service.category_repo.get_item_count(cat.id)
    return ApiResponse(success=True, message="Category retrieved successfully", data=resp)


@admin_router.post(
    "",
    response_model=ApiResponse[CategoryResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create Category (Admin)",
    description="Creates a new menu category.",
)
def admin_create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = MenuService(db)
    cat = service.create_category(data)
    resp = CategoryResponse.model_validate(cat)
    return ApiResponse(success=True, message="Category created successfully", data=resp)


@admin_router.put(
    "/{id}",
    response_model=ApiResponse[CategoryResponse],
    summary="Update Category (Admin)",
    description="Updates existing category details.",
)
def admin_update_category(
    id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = MenuService(db)
    cat = service.update_category(id, data)
    resp = CategoryResponse.model_validate(cat)
    return ApiResponse(success=True, message="Category updated successfully", data=resp)


@admin_router.delete(
    "/{id}",
    response_model=ApiResponse[None],
    summary="Delete Category (Admin)",
    description="Deletes a category permanently from the database.",
)
def admin_delete_category(
    id: int,
    hard: bool = True,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = MenuService(db)
    service.delete_category(id, hard=hard)
    return ApiResponse(success=True, message="Category deleted successfully")


@admin_router.patch(
    "/{id}/status",
    response_model=ApiResponse[CategoryResponse],
    summary="Update Category Active Status (Admin)",
    description="Activates or deactivates a category.",
)
def admin_set_category_status(
    id: int,
    data: CategoryStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = MenuService(db)
    cat = service.set_category_status(id, data.is_active)
    resp = CategoryResponse.model_validate(cat)
    return ApiResponse(success=True, message="Category status updated successfully", data=resp)


@admin_router.patch(
    "/reorder",
    response_model=ApiResponse[None],
    summary="Reorder Categories (Admin)",
    description="Updates display order for a list of categories.",
)
def admin_reorder_categories(
    items: List[CategoryReorderItem],
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = MenuService(db)
    service.reorder_categories(items)
    return ApiResponse(success=True, message="Categories reordered successfully")


@admin_router.post(
    "/{id}/image",
    response_model=ApiResponse[CategoryResponse],
    summary="Upload Category Image (Admin)",
    description="Uploads and associates an image file for a category.",
)
async def admin_upload_category_image(
    id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = MenuService(db)
    cat = service.category_repo.get_by_id(id)
    if not cat:
        raise NotFoundError("Category not found", error_code="CATEGORY_NOT_FOUND")

    image_url = await upload_service.upload_image(file, subfolder="categories")
    cat.image = image_url
    service.category_repo.update(cat)
    resp = CategoryResponse.model_validate(cat)
    return ApiResponse(success=True, message="Category image uploaded successfully", data=resp)
