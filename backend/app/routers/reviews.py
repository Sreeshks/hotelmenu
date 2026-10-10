from typing import Optional, List
from fastapi import APIRouter, Depends, Request, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.admin import Admin
from app.schemas.review import (
    ReviewCreate,
    ReviewResponse,
    ReviewApprovalUpdate,
    ReviewVisibilityUpdate,
    ReviewImageResponse,
)
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.services.review_service import ReviewService
from app.services.upload_service import upload_service
from app.core.exceptions import NotFoundError

public_router = APIRouter(prefix="/reviews", tags=["Reviews"])
admin_router = APIRouter(prefix="/admin/reviews", tags=["Admin Reviews"])


# ------------------ PUBLIC ENDPOINTS ------------------

@public_router.post(
    "",
    response_model=ApiResponse[ReviewResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Submit Customer Review",
    description="Submits a review for food, serving staff, or general restaurant experience with anti-spam rate limiting and cooldown.",
)
def submit_review(
    data: ReviewCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "127.0.0.1"
    service = ReviewService(db)
    review = service.submit_review(data, client_ip=client_ip)

    resp = ReviewResponse.model_validate(review)
    resp.menu_item_name = review.menu_item.name if review.menu_item else None
    resp.staff_name = review.staff.name if review.staff else None
    resp.location_name = review.location.name if review.location else None
    resp.images = [ReviewImageResponse.model_validate(img) for img in review.images]

    return ApiResponse(
        success=True,
        message="Review submitted successfully. Thank you for your feedback!",
        data=resp,
    )


@public_router.get(
    "",
    response_model=PaginatedResponse[ReviewResponse],
    summary="List Public Reviews",
    description="Returns approved and visible reviews for the customer menu. Supports filtering by type and pagination.",
)
def list_public_reviews(
    review_type: Optional[str] = Query(None, pattern="^(MENU_ITEM|STAFF|RESTAURANT)$"),
    menu_item_id: Optional[int] = Query(None),
    staff_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    service = ReviewService(db)
    skip = (page - 1) * limit
    reviews, total = service.review_repo.filter_reviews(
        review_type=review_type,
        menu_item_id=menu_item_id,
        staff_id=staff_id,
        # Public endpoint: only show approved and visible reviews
        is_approved=True,
        is_visible=True,
        skip=skip,
        limit=limit,
    )

    data = []
    for r in reviews:
        resp = ReviewResponse.model_validate(r)
        resp.menu_item_name = r.menu_item.name if r.menu_item else None
        resp.staff_name = r.staff.name if r.staff else None
        resp.location_name = r.location.name if r.location else None
        resp.images = [ReviewImageResponse.model_validate(img) for img in r.images]
        data.append(resp)

    total_pages = (total + limit - 1) // limit if total > 0 else 0
    return PaginatedResponse(
        success=True,
        message="Reviews retrieved successfully",
        data=data,
        pagination=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages),
    )


@public_router.post(
    "/upload-image",
    response_model=ApiResponse[str],
    summary="Upload Review Image",
    description="Uploads an image file to attach to a customer review (max 3 images per review).",
)
async def upload_review_image(
    file: UploadFile = File(...),
):
    image_url = await upload_service.upload_image(file, subfolder="reviews")
    return ApiResponse(success=True, message="Image uploaded successfully", data=image_url)



# ------------------ ADMIN ENDPOINTS ------------------

@admin_router.get(
    "",
    response_model=PaginatedResponse[ReviewResponse],
    summary="List Reviews (Admin)",
    description="Lists customer reviews with filtering by type, entity, approval, and visibility.",
)
def admin_list_reviews(
    review_type: Optional[str] = Query(None, pattern="^(MENU_ITEM|STAFF|RESTAURANT)$"),
    menu_item_id: Optional[int] = Query(None),
    staff_id: Optional[int] = Query(None),
    location_id: Optional[int] = Query(None),
    is_approved: Optional[bool] = Query(None),
    is_visible: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = ReviewService(db)
    skip = (page - 1) * limit
    reviews, total = service.review_repo.filter_reviews(
        review_type=review_type,
        menu_item_id=menu_item_id,
        staff_id=staff_id,
        location_id=location_id,
        is_approved=is_approved,
        is_visible=is_visible,
        skip=skip,
        limit=limit,
    )

    data = []
    for r in reviews:
        resp = ReviewResponse.model_validate(r)
        resp.menu_item_name = r.menu_item.name if r.menu_item else None
        resp.staff_name = r.staff.name if r.staff else None
        resp.location_name = r.location.name if r.location else None
        resp.images = [ReviewImageResponse.model_validate(img) for img in r.images]
        data.append(resp)

    total_pages = (total + limit - 1) // limit if total > 0 else 0
    return PaginatedResponse(
        success=True,
        message="Reviews retrieved successfully",
        data=data,
        pagination=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages),
    )


@admin_router.get(
    "/{id}",
    response_model=ApiResponse[ReviewResponse],
    summary="Get Review by ID (Admin)",
    description="Retrieves a single review with full details.",
)
def admin_get_review(
    id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = ReviewService(db)
    r = service.review_repo.get_with_details(id)
    if not r:
        raise NotFoundError("Review not found", error_code="REVIEW_NOT_FOUND")

    resp = ReviewResponse.model_validate(r)
    resp.menu_item_name = r.menu_item.name if r.menu_item else None
    resp.staff_name = r.staff.name if r.staff else None
    resp.location_name = r.location.name if r.location else None
    resp.images = [ReviewImageResponse.model_validate(img) for img in r.images]
    return ApiResponse(success=True, message="Review retrieved successfully", data=resp)


@admin_router.patch(
    "/{id}/approve",
    response_model=ApiResponse[ReviewResponse],
    summary="Moderate Review Approval (Admin)",
    description="Approves or rejects a customer review and recalculates related ratings.",
)
def admin_approve_review(
    id: int,
    data: ReviewApprovalUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = ReviewService(db)
    r = service.update_approval(id, data.is_approved)
    resp = ReviewResponse.model_validate(r)
    return ApiResponse(success=True, message="Review approval status updated", data=resp)


@admin_router.patch(
    "/{id}/visibility",
    response_model=ApiResponse[ReviewResponse],
    summary="Toggle Review Visibility (Admin)",
    description="Hides or unhides a review from public digital menu view.",
)
def admin_set_review_visibility(
    id: int,
    data: ReviewVisibilityUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = ReviewService(db)
    r = service.update_visibility(id, data.is_visible)
    resp = ReviewResponse.model_validate(r)
    return ApiResponse(success=True, message="Review visibility updated", data=resp)


@admin_router.delete(
    "/{id}",
    response_model=ApiResponse[None],
    summary="Delete Review (Admin)",
    description="Deletes a customer review.",
)
def admin_delete_review(
    id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    service = ReviewService(db)
    service.delete_review(id)
    return ApiResponse(success=True, message="Review deleted successfully")
