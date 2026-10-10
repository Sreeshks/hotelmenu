from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.qr_code import QRCodeResponse


class LocationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    location_type: str = Field(default="TABLE", pattern="^(TABLE|ROOM|RESTAURANT|OTHER)$")
    table_number: Optional[str] = Field(None, max_length=50)
    room_number: Optional[str] = Field(None, max_length=50)
    is_active: bool = True


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    location_type: Optional[str] = Field(None, pattern="^(TABLE|ROOM|RESTAURANT|OTHER)$")
    table_number: Optional[str] = Field(None, max_length=50)
    room_number: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class LocationResponse(LocationBase):
    id: int
    qr_token: str
    qr_image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerLocationInfo(BaseModel):
    id: int
    name: str
    type: str
    table_number: Optional[str] = None
    room_number: Optional[str] = None
    # Branding fields — populated from the Location record so the frontend
    # can show the correct restaurant name without hardcoding defaults.
    restaurant_name: Optional[str] = None
    tagline: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    hours: Optional[str] = None
    currency: Optional[str] = None
    wifi_ssid: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
