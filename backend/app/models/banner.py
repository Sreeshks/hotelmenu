from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime
from app.core.database import Base
from app.models.base import TimestampMixin


class Banner(Base, TimestampMixin):
    __tablename__ = "banners"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(150), nullable=False)
    subtitle = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=False)
    button_text = Column(String(50), nullable=True)
    button_link = Column(String(255), nullable=True)
    display_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, index=True, nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    schedule_days = Column(String(255), nullable=True)  # Comma-separated day names e.g. "Monday,Tuesday" or "All"
    start_time = Column(String(10), nullable=True)      # e.g. "06:00"
    end_time = Column(String(10), nullable=True)        # e.g. "11:30"

    def __repr__(self) -> str:
        return f"<Banner(id={self.id}, title='{self.title}', is_active={self.is_active})>"
