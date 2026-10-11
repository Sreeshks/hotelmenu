from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.admin import Admin
from app.schemas.staff import (
    StaffCreate,
    StaffUpdate,
    StaffPublicResponse,
    StaffAdminResponse,
    StaffRatingStats,
)
from app.schemas.common import ApiResponse
from app.services.staff_service import StaffService
from app.services.upload_service import upload_service
from app.core.exceptions import NotFoundError

public_router = APIRouter(prefix="/staff", tags=["Staff"])
admin_router = APIRouter(prefix="/admin/staff", tags=["Admin Staff"])


# ------------------ PUBLIC ENDPOINTS ------------------

@public_router.get(
    "",
    response_model=ApiResponse[List[StaffPublicResponse]],
    summary="Get Active Staff (Customer)",
    description="Returns active staff members for customer rating and service identification (safe fields only).",
)
def get_active_staff(db: Session = Depends(get_db)):
    service = StaffService(db)
    staff_list = service.staff_repo.get_active_staff()
    data = [StaffPublicResponse.model_validate(s) for s in staff_list]
    return ApiResponse(success=True, message="Staff list retrieved successfully", data=data)


# ------------------ ADMIN ENDPOINTS ------------------

@admin_router.get(
    "",
    response_model=ApiResponse[List[StaffAdminResponse]],
    summary="List All Staff (Admin)",
    description="Lists all staff members including employee codes and inactive status.",
)
def admin_list_staff(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = StaffService(db)
    staff_list = service.staff_repo.get_all_admin(skip=skip, limit=limit)
    data = [StaffAdminResponse.model_validate(s) for s in staff_list]
    return ApiResponse(success=True, message="Staff members retrieved successfully", data=data)


@admin_router.get(
    "/{id}",
    response_model=ApiResponse[StaffAdminResponse],
    summary="Get Staff by ID (Admin)",
    description="Retrieves a single staff member's administrative details.",
)
def admin_get_staff(
    id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = StaffService(db)
    staff = service.staff_repo.get_by_id(id)
    if not staff:
        raise NotFoundError("Staff member not found", error_code="STAFF_NOT_FOUND")
    return ApiResponse(success=True, message="Staff member retrieved successfully", data=StaffAdminResponse.model_validate(staff))


@admin_router.post(
    "",
    response_model=ApiResponse[StaffAdminResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create Staff Member (Admin)",
    description="Adds a new serving or waiting staff member.",
)
def admin_create_staff(
    data: StaffCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = StaffService(db)
    staff = service.create_staff(data)
    return ApiResponse(success=True, message="Staff member created successfully", data=StaffAdminResponse.model_validate(staff))


@admin_router.put(
    "/{id}",
    response_model=ApiResponse[StaffAdminResponse],
    summary="Update Staff Member (Admin)",
    description="Updates staff member information.",
)
def admin_update_staff(
    id: int,
    data: StaffUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = StaffService(db)
    staff = service.update_staff(id, data)
    return ApiResponse(success=True, message="Staff member updated successfully", data=StaffAdminResponse.model_validate(staff))


@admin_router.delete(
    "/{id}",
    response_model=ApiResponse[None],
    summary="Delete Staff Member (Admin)",
    description="Deletes a staff member permanently from the database.",
)
def admin_delete_staff(
    id: int,
    hard: bool = True,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = StaffService(db)
    service.delete_staff(id, hard=hard)
    return ApiResponse(success=True, message="Staff member deleted successfully")


@admin_router.post(
    "/{id}/image",
    response_model=ApiResponse[StaffAdminResponse],
    summary="Upload Staff Profile Image (Admin)",
    description="Uploads and updates staff member's profile image.",
)
async def admin_upload_staff_image(
    id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = StaffService(db)
    staff = service.staff_repo.get_by_id(id)
    if not staff:
        raise NotFoundError("Staff member not found", error_code="STAFF_NOT_FOUND")

    image_url = await upload_service.upload_image(file, subfolder="staff")
    staff.profile_image = image_url
    service.staff_repo.update(staff)

    return ApiResponse(success=True, message="Staff image uploaded successfully", data=StaffAdminResponse.model_validate(staff))


@admin_router.get(
    "/{id}/ratings",
    response_model=ApiResponse[StaffRatingStats],
    summary="Get Staff Rating Distribution (Admin)",
    description="Returns detailed rating statistics including average, total, and 1-to-5 star breakdown.",
)
def admin_get_staff_ratings(
    id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = StaffService(db)
    stats = service.get_rating_stats(id)
    return ApiResponse(success=True, message="Staff rating statistics retrieved successfully", data=stats)
