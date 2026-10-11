from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from app.models.staff import Staff
from app.models.review import Review
from app.schemas.staff import StaffCreate, StaffUpdate, StaffRatingStats
from app.repositories.staff_repository import StaffRepository
from app.core.exceptions import NotFoundError, ConflictError


class StaffService:
    def __init__(self, db: Session):
        self.db = db
        self.staff_repo = StaffRepository(db)

    def create_staff(self, data: StaffCreate) -> Staff:
        existing = self.staff_repo.get_by_employee_code(data.employee_code)
        if existing:
            raise ConflictError(
                f"Employee code '{data.employee_code}' already exists",
                error_code="EMPLOYEE_CODE_EXISTS",
            )

        staff = Staff(
            name=data.name,
            employee_code=data.employee_code,
            profile_image=data.profile_image,
            designation=data.designation,
            is_active=data.is_active,
        )
        return self.staff_repo.create(staff)

    def update_staff(self, id: int, data: StaffUpdate) -> Staff:
        staff = self.staff_repo.get_by_id(id)
        if not staff:
            raise NotFoundError("Staff member not found", error_code="STAFF_NOT_FOUND")

        update_data = data.model_dump(exclude_unset=True)
        if "employee_code" in update_data and update_data["employee_code"] != staff.employee_code:
            existing = self.staff_repo.get_by_employee_code(update_data["employee_code"])
            if existing:
                raise ConflictError(
                    f"Employee code '{update_data['employee_code']}' already exists",
                    error_code="EMPLOYEE_CODE_EXISTS",
                )

        for field, value in update_data.items():
            setattr(staff, field, value)

        return self.staff_repo.update(staff)

    def delete_staff(self, id: int, hard: bool = True) -> None:
        staff = self.staff_repo.get_by_id(id)
        if not staff:
            raise NotFoundError("Staff member not found", error_code="STAFF_NOT_FOUND")

        if hard:
            reviews = self.db.query(Review).filter(Review.staff_id == staff.id).all()
            for r in reviews:
                self.db.delete(r)
            self.staff_repo.delete(staff)
        else:
            staff.is_active = False
            self.staff_repo.update(staff)

    def get_rating_stats(self, id: int) -> StaffRatingStats:
        staff = self.staff_repo.get_by_id(id)
        if not staff:
            raise NotFoundError("Staff member not found", error_code="STAFF_NOT_FOUND")

        distribution = self.staff_repo.get_rating_distribution(id)
        return StaffRatingStats(
            average_rating=staff.average_rating,
            total_ratings=staff.total_ratings,
            distribution=distribution,
        )
