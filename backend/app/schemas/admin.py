from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class AdminBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    role: str = Field(default="admin", pattern="^(super_admin|admin)$")
    is_active: bool = True


class AdminCreate(AdminBase):
    password: str = Field(..., min_length=6, max_length=128)


class AdminUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    role: Optional[str] = Field(None, pattern="^(super_admin|admin)$")
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6, max_length=128)


class AdminResponse(AdminBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClearDataRequest(BaseModel):
    target: str = Field(
        default="all",
        pattern="^(all|products|categories)$",
        description="Scope of catalog data to clear: 'all', 'products', or 'categories'",
    )


class ClearDataResponse(BaseModel):
    items_deleted: int
    categories_deleted: int
    reviews_deleted: int
    target: str
    message: str

