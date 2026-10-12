import os
from typing import Tuple
from fastapi import UploadFile
from app.core.config import settings
from app.core.exceptions import AppException

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".svg"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg", "image/svg+xml"}


def validate_image_file(file: UploadFile, content: bytes) -> None:
    """
    Validates uploaded image file extension, MIME type, size, and magic bytes.
    Raises AppException if validation fails.
    """
    # 1. Check extension
    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise AppException(
            message=f"Invalid file extension '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
            error_code="INVALID_FILE_EXTENSION",
            status_code=400,
        )

    # 2. Check declared content type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise AppException(
            message=f"Invalid MIME type '{file.content_type}'. Allowed: {', '.join(ALLOWED_MIME_TYPES)}",
            error_code="INVALID_MIME_TYPE",
            status_code=400,
        )

    # 3. Check size
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise AppException(
            message=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB",
            error_code="FILE_TOO_LARGE",
            status_code=400,
        )

    if len(content) == 0:
        raise AppException(
            message="Uploaded file is empty",
            error_code="EMPTY_FILE",
            status_code=400,
        )

    # 4. Check magic bytes / content
    is_valid_header = False
    if content.startswith(b"\xff\xd8\xff"):  # JPEG
        is_valid_header = True
    elif content.startswith(b"\x89PNG\r\n\x1a\n"):  # PNG
        is_valid_header = True
    elif content.startswith(b"RIFF") and len(content) >= 12 and content[8:12] == b"WEBP":  # WEBP
        is_valid_header = True
    elif ext == ".svg" or file.content_type == "image/svg+xml":
        # Check SVG xml/svg tag
        header_sample = content[:500].lower()
        if b"<svg" in header_sample or b"<?xml" in header_sample:
            is_valid_header = True

    if not is_valid_header:
        raise AppException(
            message="File content does not match allowed image formats (JPEG, PNG, WEBP, SVG)",
            error_code="CORRUPT_OR_FORGED_IMAGE",
            status_code=400,
        )
