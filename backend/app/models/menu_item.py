from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class MenuItem(Base, TimestampMixin):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    slug = Column(String(180), unique=True, index=True, nullable=False)
    short_description = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False, default=0.0)
    original_price = Column(Float, nullable=True)  # Regular/strikethrough price for combos or offers
    is_combo = Column(Boolean, default=False, index=True, nullable=False)
    combo_items = Column(Text, nullable=True)  # JSON-encoded list of items in combo
    image_url = Column(Text, nullable=True)
    images = Column(Text, nullable=True)  # JSON-encoded list of up to 3 image URLs
    rating = Column(Float, default=0.0, nullable=False)
    review_count = Column(Integer, default=0, nullable=False)
    is_available = Column(Boolean, default=True, index=True, nullable=False)  # Live Stock availability
    is_featured = Column(Boolean, default=False, nullable=False)
    is_popular = Column(Boolean, default=False, nullable=False)
    is_bestseller = Column(Boolean, default=False, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    preparation_time = Column(String(50), nullable=True)
    tags = Column(String(255), nullable=True)  # Comma-separated tags
    is_vegetarian = Column(Boolean, default=False, index=True, nullable=False)
    is_active = Column(Boolean, default=True, index=True, nullable=False)  # Soft delete

    # Relationships
    category = relationship("Category", back_populates="menu_items")
    reviews = relationship("Review", back_populates="menu_item", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<MenuItem(id={self.id}, name='{self.name}', price={self.price}, available={self.is_available})>"
