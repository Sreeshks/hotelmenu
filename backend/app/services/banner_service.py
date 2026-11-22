from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.banner import Banner
from app.schemas.banner import BannerCreate, BannerUpdate
from app.repositories.banner_repository import BannerRepository
from app.core.exceptions import NotFoundError
from app.services.realtime_service import manager


class BannerService:
    def __init__(self, db: Session):
        self.db = db
        self.banner_repo = BannerRepository(db)

    def create_banner(self, data: BannerCreate) -> Banner:
        banner = Banner(
            title=data.title,
            subtitle=data.subtitle,
            description=data.description,
            image_url=data.image_url,
            button_text=data.button_text,
            button_link=data.button_link,
            display_order=data.display_order,
            is_active=data.is_active,
            start_date=data.start_date,
            end_date=data.end_date,
            schedule_days=data.schedule_days,
            start_time=data.start_time,
            end_time=data.end_time,
        )
        created = self.banner_repo.create(banner)
        manager.increment_menu_version(self.db)
        return created

    def update_banner(self, id: int, data: BannerUpdate) -> Banner:
        banner = self.banner_repo.get_by_id(id)
        if not banner:
            raise NotFoundError("Banner not found", error_code="BANNER_NOT_FOUND")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(banner, field, value)

        updated = self.banner_repo.update(banner)
        manager.increment_menu_version(self.db)
        return updated

    def delete_banner(self, id: int) -> None:
        banner = self.banner_repo.get_by_id(id)
        if not banner:
            raise NotFoundError("Banner not found", error_code="BANNER_NOT_FOUND")

        self.banner_repo.delete(banner)
        manager.increment_menu_version(self.db)
