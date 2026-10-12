from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.admin import Admin
from app.schemas.common import ApiResponse
from app.services.settings_service import settings_service
from app.services.realtime_service import manager

public_router = APIRouter(prefix="/settings", tags=["Settings"])
admin_router = APIRouter(prefix="/admin/settings", tags=["Admin Settings"])


class SettingsUpdateRequest(BaseModel):
    restaurant_name: Optional[str] = None
    tagline: Optional[str] = None
    currency: Optional[str] = None
    dining_hours: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    wifi_ssid: Optional[str] = None
    logo_url: Optional[str] = None
    theme_preset: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None


@public_router.get(
    "",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Get Public Restaurant Settings",
    description="Returns public restaurant settings including active currency symbol, restaurant name, and hours.",
)
def get_public_settings():
    data = settings_service.get_settings()
    return ApiResponse(success=True, message="Settings retrieved successfully", data=data)


@admin_router.get(
    "",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Get Admin Restaurant Settings",
    description="Returns all configuration settings for admin management.",
)
def get_admin_settings(current_admin: Admin = Depends(get_current_admin)):
    data = settings_service.get_settings()
    return ApiResponse(success=True, message="Settings retrieved successfully", data=data)


@admin_router.put(
    "",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Update Restaurant Settings (Admin)",
    description="Updates restaurant settings such as currency symbol, establishment name, and timings.",
)
async def update_admin_settings(
    payload: SettingsUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    updates = payload.model_dump(exclude_unset=True)
    updated = settings_service.update_settings(updates)
    manager.increment_menu_version(db)
    try:
        await manager.broadcast("SETTINGS_UPDATED", updated)
        await manager.broadcast("MENU_VERSION_UPDATED", {"version": "updated"})
    except Exception:
        pass
    return ApiResponse(success=True, message="Settings updated successfully", data=updated)
