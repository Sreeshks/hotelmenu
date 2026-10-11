import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logging import RequestLoggingMiddleware, logger
from app.core.exceptions import (
    AppException,
    app_exception_handler,
    validation_exception_handler,
    http_exception_handler,
    unhandled_exception_handler,
)

# Routers
from app.routers.auth import router as auth_router
from app.routers.customer_menu import router as customer_menu_router
from app.routers.categories import public_router as categories_public_router, admin_router as categories_admin_router
from app.routers.menu_items import public_router as menu_items_public_router, admin_router as menu_items_admin_router
from app.routers.banners import public_router as banners_public_router, admin_router as banners_admin_router
from app.routers.staff import public_router as staff_public_router, admin_router as staff_admin_router
from app.routers.locations import router as locations_router
from app.routers.reviews import public_router as reviews_public_router, admin_router as reviews_admin_router
from app.routers.admin import router as admin_router
from app.routers.websocket import router as websocket_router
from app.routers.health import router as health_router


from app.core.database import Base, engine
import app.models  # Register all models for metadata


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist
    try:
        Base.metadata.create_all(bind=engine)
        try:
            with engine.connect() as conn:
                from sqlalchemy import text
                conn.execute(text("ALTER TABLE menu_items ADD COLUMN images TEXT"))
                conn.commit()
        except Exception:
            pass
        logger.info("Database tables initialized/verified.")

        # Run auto-seed if enabled
        if settings.AUTO_SEED:
            try:
                from seed import seed_database
                seed_database()
                logger.info("Database auto-seeded successfully on startup.")
            except Exception as se:
                logger.error(f"Error during startup database auto-seed: {se}")
    except Exception as e:
        logger.error(f"Error ensuring database tables: {e}")

    # Ensure upload directories exist
    upload_folders = ["banners", "menu_items", "staff", "reviews", "qrcodes", "categories"]
    for folder in upload_folders:
        os.makedirs(os.path.join(settings.UPLOAD_DIR, folder), exist_ok=True)
    logger.info("Application starting up... Upload directories initialized.")
    yield
    logger.info("Application shutting down...")



app = FastAPI(
    title="Hotel Digital Menu System API",
    description="""
Production-ready REST API and WebSocket backend for Hotel Digital Menu / Restaurant Menu Display System.
Features:
- Live stock availability toggles via WebSockets
- QR code token location management
- Customer menu browsing, filtering, and search
- Customer ratings for food, waitstaff, and restaurant
- Comprehensive admin management dashboard
- Designed for Next.js customer and admin frontends
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Middlewares
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins if settings.cors_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Centralized Exception Handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# Static file serving for uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Health routes
app.include_router(health_router)

# API v1 Routers
api_v1_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1_prefix)
app.include_router(customer_menu_router, prefix=api_v1_prefix)
app.include_router(categories_public_router, prefix=api_v1_prefix)
app.include_router(categories_admin_router, prefix=api_v1_prefix)
app.include_router(menu_items_public_router, prefix=api_v1_prefix)
app.include_router(menu_items_admin_router, prefix=api_v1_prefix)
app.include_router(banners_public_router, prefix=api_v1_prefix)
app.include_router(banners_admin_router, prefix=api_v1_prefix)
app.include_router(staff_public_router, prefix=api_v1_prefix)
app.include_router(staff_admin_router, prefix=api_v1_prefix)
app.include_router(locations_router, prefix=api_v1_prefix)
app.include_router(reviews_public_router, prefix=api_v1_prefix)
app.include_router(reviews_admin_router, prefix=api_v1_prefix)
app.include_router(admin_router, prefix=api_v1_prefix)
app.include_router(websocket_router, prefix=api_v1_prefix)
