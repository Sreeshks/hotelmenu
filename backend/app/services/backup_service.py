import json
import datetime
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import inspect
from app.core.database import engine
from app.models.admin import Admin
from app.models.category import Category
from app.models.menu_item import MenuItem
from app.models.banner import Banner
from app.models.staff import Staff
from app.models.location import Location
from app.models.qr_code import QRCode
from app.models.review import Review, ReviewImage
from app.models.menu_version import MenuVersion
from app.services.settings_service import settings_service


class BackupService:
    TABLE_MODELS = [
        ("menu_versions", MenuVersion),
        ("admins", Admin),
        ("categories", Category),
        ("menu_items", MenuItem),
        ("locations", Location),
        ("qr_codes", QRCode),
        ("banners", Banner),
        ("staff", Staff),
        ("reviews", Review),
        ("review_images", ReviewImage),
    ]

    def _sql_escape(self, val: Any) -> str:
        if val is None:
            return "NULL"
        if isinstance(val, bool):
            return "TRUE" if val else "FALSE"
        if isinstance(val, (int, float)):
            return str(val)
        if isinstance(val, (datetime.datetime, datetime.date)):
            return f"'{val.isoformat()}'"
        if isinstance(val, (dict, list)):
            escaped = json.dumps(val).replace("'", "''")
            return f"'{escaped}'"
        # String or other
        escaped_str = str(val).replace("'", "''")
        return f"'{escaped_str}'"

    def get_database_stats(self, db: Session) -> Dict[str, Any]:
        stats = {}
        for table_name, model in self.TABLE_MODELS:
            try:
                stats[table_name] = db.query(model).count()
            except Exception:
                stats[table_name] = 0
        return {
            "counts": stats,
            "total_records": sum(stats.values()),
            "dialect": engine.dialect.name,
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }

    def generate_json_export(self, db: Session) -> Dict[str, Any]:
        export_data = {
            "metadata": {
                "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "dialect": engine.dialect.name,
                "version": "1.0",
                "settings": settings_service.get_settings(),
            },
            "tables": {},
        }

        for table_name, model in self.TABLE_MODELS:
            try:
                rows = db.query(model).all()
            except Exception:
                db.rollback()
                continue

            mapper = inspect(model)
            columns = [c.key for c in mapper.column_attrs]
            table_rows = []
            for r in rows:
                row_dict = {}
                for col in columns:
                    val = getattr(r, col)
                    if isinstance(val, (datetime.datetime, datetime.date)):
                        val = val.isoformat()
                    row_dict[col] = val
                table_rows.append(row_dict)
            export_data["tables"][table_name] = table_rows

        return export_data

    def generate_sql_dump(self, db: Session) -> str:
        now_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        is_postgres = "postgresql" in str(engine.url)
        lines: List[str] = [
            f"-- ====================================================================",
            f"-- HOTEL DIGITAL MENU SYSTEM - DATABASE BACKUP DUMP",
            f"-- Generated At: {now_str}",
            f"-- Database Engine: {'PostgreSQL' if is_postgres else 'SQLite'}",
            f"-- ====================================================================",
            "",
            "BEGIN TRANSACTION;" if not is_postgres else "BEGIN;",
            "",
        ]

        for table_name, model in self.TABLE_MODELS:
            try:
                rows = db.query(model).all()
            except Exception:
                db.rollback()
                continue

            if not rows:
                continue

            mapper = inspect(model)
            columns = [c.key for c in mapper.column_attrs]
            col_names_sql = ", ".join([f'"{c}"' if is_postgres else f"`{c}`" for c in columns])

            lines.append(f"-- Table: {table_name} ({len(rows)} records)")
            # Chunk inserts into batches of 50
            batch_size = 50
            for i in range(0, len(rows), batch_size):
                batch = rows[i : i + batch_size]
                val_tuples = []
                for r in batch:
                    vals = [self._sql_escape(getattr(r, col)) for col in columns]
                    val_tuples.append(f"  ({', '.join(vals)})")
                lines.append(f"INSERT INTO {table_name} ({col_names_sql}) VALUES")
                lines.append(",\n".join(val_tuples) + ";")
            lines.append("")

            # PostgreSQL sequence reset
            if is_postgres and "id" in columns:
                lines.append(
                    f"SELECT setval('{table_name}_id_seq', COALESCE((SELECT MAX(id) FROM {table_name}), 1), true);"
                )
                lines.append("")

        lines.append("COMMIT;")
        lines.append("")
        return "\n".join(lines)


backup_service = BackupService()
