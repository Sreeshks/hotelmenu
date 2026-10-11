import os
import uuid
import base64
import json
import logging
import asyncio
import urllib.request
import urllib.parse
from abc import ABC, abstractmethod
from fastapi import UploadFile
from app.core.config import settings
from app.utils.validators import validate_image_file

logger = logging.getLogger(__name__)


class UploadService(ABC):
    @abstractmethod
    async def upload_image(self, file: UploadFile, subfolder: str) -> str:
        """Uploads an image and returns the public accessible URL."""
        pass

    @abstractmethod
    def delete_image(self, image_url: str) -> bool:
        """Deletes an image by its URL/path."""
        pass


class LocalUploadService(UploadService):
    def __init__(self, base_dir: str = None):
        self.base_dir = base_dir or settings.UPLOAD_DIR

    async def upload_image(self, file: UploadFile, subfolder: str) -> str:
        content = await file.read()
        validate_image_file(file, content)
        return await self.upload_image_bytes(content, file.filename, subfolder)

    async def upload_image_bytes(self, content: bytes, filename: str, subfolder: str) -> str:
        # Create target subfolder if not existing
        target_dir = os.path.join(self.base_dir, subfolder)
        os.makedirs(target_dir, exist_ok=True)

        # Generate unique filename
        original_ext = os.path.splitext(filename or "")[1].lower()
        if not original_ext:
            original_ext = ".jpg"
        unique_name = f"{uuid.uuid4().hex[:16]}{original_ext}"
        destination_path = os.path.join(target_dir, unique_name)

        # Write to disk
        with open(destination_path, "wb") as f:
            f.write(content)

        # Return web-accessible URL
        return f"/uploads/{subfolder}/{unique_name}"

    def delete_image(self, image_url: str) -> bool:
        if not image_url or not image_url.startswith("/uploads/"):
            return False

        rel_path = image_url.lstrip("/uploads/")
        file_path = os.path.join(self.base_dir, rel_path)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                return True
            except OSError:
                return False
        return False


class ImgBBUploadService(UploadService):
    def __init__(self, api_key: str = None, fallback_service: UploadService = None):
        self.api_key = api_key or getattr(settings, "IMGBB_API_KEY", "") or "34b1022bc8d3afbe2dc9875cba76714d"
        self.fallback_service = fallback_service or LocalUploadService()
        self.api_url = "https://api.imgbb.com/1/upload"

    async def upload_image(self, file: UploadFile, subfolder: str) -> str:
        content = await file.read()
        validate_image_file(file, content)
        return await self.upload_image_bytes(content, file.filename, subfolder)

    async def upload_image_bytes(self, content: bytes, filename: str, subfolder: str = "general") -> str:
        if not self.api_key:
            logger.warning("No ImgBB API key found, using local storage fallback")
            return await self.fallback_service.upload_image_bytes(content, filename, subfolder)

        try:
            b64_content = base64.b64encode(content).decode("utf-8")
            result = await asyncio.to_thread(self._sync_upload, b64_content, filename)
            if result.get("success") and "data" in result:
                url = result["data"].get("url") or result["data"].get("display_url")
                if url:
                    logger.info(f"Successfully uploaded image to ImgBB: {url}")
                    return url
            raise RuntimeError(f"ImgBB upload did not return URL: {result}")
        except Exception as e:
            logger.error(f"ImgBB upload error: {e}. Falling back to local storage.", exc_info=True)
            return await self.fallback_service.upload_image_bytes(content, filename, subfolder)

    def _sync_upload(self, b64_content: str, filename: str) -> dict:
        clean_name = os.path.splitext(filename or "image")[0] if filename else "image"
        clean_name = "".join(c for c in clean_name if c.isalnum() or c in ("-", "_"))[:50] or "image"

        payload = {
            "key": self.api_key,
            "image": b64_content,
            "name": clean_name,
        }
        encoded_data = urllib.parse.urlencode(payload).encode("utf-8")
        req = urllib.request.Request(
            self.api_url,
            data=encoded_data,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            resp_body = response.read().decode("utf-8")
            return json.loads(resp_body)

    def delete_image(self, image_url: str) -> bool:
        if image_url and image_url.startswith("/uploads/"):
            return self.fallback_service.delete_image(image_url)
        return False


def get_upload_service() -> UploadService:
    storage_type = getattr(settings, "UPLOAD_STORAGE_TYPE", "imgbb").lower()
    imgbb_key = getattr(settings, "IMGBB_API_KEY", "") or "34b1022bc8d3afbe2dc9875cba76714d"
    if storage_type == "imgbb" and imgbb_key:
        return ImgBBUploadService(api_key=imgbb_key)
    return LocalUploadService()


# Active singleton upload service
upload_service: UploadService = get_upload_service()
