import json
import os
from typing import Dict, Any

DEFAULT_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "restaurant_settings.json")
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/app/uploads")

# Prefer storing settings in persistent upload directory if available
if os.path.isdir(UPLOAD_DIR):
    SETTINGS_FILE = os.path.join(UPLOAD_DIR, "restaurant_settings.json")
else:
    SETTINGS_FILE = DEFAULT_FILE

DEFAULT_SETTINGS: Dict[str, Any] = {
    "restaurant_name": "Koottu Curry Restaurant",
    "tagline": "Authentic Kerala, Malabar & Arabic Cuisine",
    "currency": "OMR ",
    "dining_hours": "Daily 06:00 AM – 12:00 AM",
    "phone": "+968 9111 0588",
    "whatsapp_number": "+968 9111 0588",
    "online_ordering_enabled": True,
    "reviews_enabled": True,
    "address": "Mabelah Sanayya / Musannah",
    "city": "Oman",
    "wifi_ssid": "KoottuCurry-Guest",
    "logo_url": None,
    "theme_preset": "maroon",
    "primary_color": "#800020",
    "secondary_color": "#D4AF37",
    "accent_color": "#5B0618",
}


class SettingsService:
    def __init__(self, file_path: str = SETTINGS_FILE):
        self.file_path = file_path

    def get_settings(self) -> Dict[str, Any]:
        # If target file doesn't exist, try copying from default/fallback file first
        if not os.path.exists(self.file_path):
            if os.path.exists(DEFAULT_FILE) and DEFAULT_FILE != self.file_path:
                try:
                    with open(DEFAULT_FILE, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    self.save_settings(data)
                    merged = DEFAULT_SETTINGS.copy()
                    merged.update(data)
                    return merged
                except Exception:
                    pass
            self.save_settings(DEFAULT_SETTINGS)
            return DEFAULT_SETTINGS.copy()

        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                merged = DEFAULT_SETTINGS.copy()
                merged.update(data)
                return merged
        except Exception:
            return DEFAULT_SETTINGS.copy()

    def save_settings(self, settings: Dict[str, Any]) -> None:
        try:
            os.makedirs(os.path.dirname(os.path.abspath(self.file_path)), exist_ok=True)
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(settings, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving restaurant settings: {e}")

    def update_settings(self, updates: Dict[str, Any]) -> Dict[str, Any]:
        current = self.get_settings()
        for k, v in updates.items():
            if v is not None:
                current[k] = v
        self.save_settings(current)
        return current


settings_service = SettingsService()
