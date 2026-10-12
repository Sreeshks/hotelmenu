import json
import os
from typing import Dict, Any

SETTINGS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "restaurant_settings.json")

DEFAULT_SETTINGS: Dict[str, Any] = {
    "restaurant_name": "Koottu Curry Restaurant",
    "tagline": "Authentic Kerala, Malabar & Arabic Cuisine",
    "currency": "OMR ",
    "dining_hours": "Daily 06:00 AM – 12:00 AM",
    "phone": "+968 9111 0588",
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
        if not os.path.exists(self.file_path):
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
