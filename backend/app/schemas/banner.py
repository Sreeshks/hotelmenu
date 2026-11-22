from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class BannerBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    subtitle: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    image_url: str = Field(..., min_length=1)
    button_text: Optional[str] = Field(None, max_length=50)
    button_link: Optional[str] = Field(None, max_length=255)
    display_order: int = Field(default=0, ge=0)
    is_active: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    schedule_days: Optional[str] = Field(None, max_length=255)
    start_time: Optional[str] = Field(None, max_length=10)
    end_time: Optional[str] = Field(None, max_length=10)


class BannerCreate(BannerBase):
    pass


class BannerUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=150)
    subtitle: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    image_url: Optional[str] = None
    button_text: Optional[str] = Field(None, max_length=50)
    button_link: Optional[str] = Field(None, max_length=255)
    display_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    schedule_days: Optional[str] = Field(None, max_length=255)
    start_time: Optional[str] = Field(None, max_length=10)
    end_time: Optional[str] = Field(None, max_length=10)


class BannerResponse(BannerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
