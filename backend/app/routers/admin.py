from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_admin, get_current_super_admin, hash_password
from app.models.admin import Admin
from app.schemas.dashboard import DashboardStatsResponse
from app.schemas.admin import AdminCreate, AdminResponse, ClearDataRequest, ClearDataResponse
from app.schemas.common import ApiResponse
from app.services.admin_service import AdminService
from app.services.menu_service import MenuService
from app.services.upload_service import upload_service
from app.repositories.admin_repository import AdminRepository
from app.core.exceptions import ConflictError, NotFoundError

router = APIRouter(prefix="/admin", tags=["Admin Dashboard & Users"])



@router.get(
    "/dashboard",
    response_model=ApiResponse[DashboardStatsResponse],
    summary="Get Admin Dashboard Statistics",
    description="Returns high-level menu counts, stock health, category counts, staff counts, reviews summary, and top items.",
)
def get_dashboard_statistics(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = AdminService(db)
    stats = service.get_dashboard_stats()
    return ApiResponse(
        success=True,
        message="Dashboard statistics retrieved successfully",
        data=stats,
    )


@router.get(
    "/users",
    response_model=ApiResponse[List[AdminResponse]],
    summary="List Admin Users (Super Admin Only)",
    description="Lists all system administrators.",
)
def list_admin_users(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_super_admin),
):
    repo = AdminRepository(db)
    admins = repo.get_all_active()
    data = [AdminResponse.model_validate(a) for a in admins]
    return ApiResponse(success=True, message="Admin users retrieved successfully", data=data)


@router.post(
    "/users",
    response_model=ApiResponse[AdminResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create Admin User (Super Admin Only)",
    description="Creates a new administrator or super administrator.",
)
def create_admin_user(
    data: AdminCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_super_admin),
):
    repo = AdminRepository(db)
    existing = repo.get_by_email(data.email)
    if existing:
        raise ConflictError(f"Email '{data.email}' is already registered", error_code="EMAIL_EXISTS")

    admin = Admin(
        name=data.name,
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        role=data.role,
        is_active=data.is_active,
    )
    saved = repo.create(admin)
    return ApiResponse(success=True, message="Admin user created successfully", data=AdminResponse.model_validate(saved))


@router.delete(
    "/users/{id}",
    response_model=ApiResponse[None],
    summary="Deactivate Admin User (Super Admin Only)",
    description="Deactivates an administrator.",
)
def delete_admin_user(
    id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_super_admin),
):
    repo = AdminRepository(db)
    admin = repo.get_by_id(id)
    if not admin:
        raise NotFoundError("Admin user not found", error_code="ADMIN_NOT_FOUND")

    admin.is_active = False
    repo.update(admin)
    return ApiResponse(success=True, message="Admin user deactivated successfully")


@router.post(
    "/clear-data",
    response_model=ApiResponse[ClearDataResponse],
    summary="Clear Menu Catalog Data (Admin Only)",
    description="Deletes all products and/or categories from the menu catalog.",
)
async def clear_catalog_data(
    payload: ClearDataRequest = ClearDataRequest(target="all"),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = MenuService(db)
    result = await service.clear_catalog_data(target=payload.target)
    return ApiResponse(
        success=True,
        message=result["message"],
        data=ClearDataResponse(**result),
    )


@router.post(
    "/upload-image",
    response_model=ApiResponse[str],
    summary="Upload Image to ImgBB (Admin)",
    description="Uploads an image file to ImgBB cloud storage and returns the public URL.",
)
async def admin_upload_image(
    file: UploadFile = File(...),
    subfolder: str = "general",
    current_admin: Admin = Depends(get_current_admin),
):
    image_url = await upload_service.upload_image(file, subfolder=subfolder)
    return ApiResponse(
        success=True,
        message="Image uploaded successfully to ImgBB",
        data=image_url,
    )

