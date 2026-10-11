import urllib.request
import urllib.parse
import re
import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger("hotel_menu.image_search")


class ImageSearchService:
    @staticmethod
    def search_images(query: str, limit: int = 24) -> List[Dict[str, Any]]:
        clean_query = query.strip()
        if not clean_query:
            return []

        results: List[Dict[str, Any]] = []
        seen = set()

        # 1. Search Web Images via Bing Images Engine
        try:
            url = f"https://www.bing.com/images/search?q={urllib.parse.quote(clean_query)}&form=HDRSC2&first=1"
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/122.0.0.0 Safari/537.36"
                    ),
                    "Accept-Language": "en-US,en;q=0.9",
                },
            )
            with urllib.request.urlopen(req, timeout=6) as resp:
                html = resp.read().decode("utf-8", errors="ignore")
                matches = re.findall(r'm="(\{.*?\})"', html)
                if matches:
                    for raw_json in matches:
                        try:
                            clean_json = raw_json.replace("&quot;", '"').replace("&amp;", "&")
                            data = json.loads(clean_json)
                            img_url = data.get("murl")
                            thumb_url = data.get("turl") or img_url
                            desc = data.get("desc") or data.get("t") or clean_query
                            if img_url and img_url.startswith("http") and img_url not in seen:
                                seen.add(img_url)
                                results.append({
                                    "url": img_url,
                                    "thumb_url": thumb_url,
                                    "title": desc,
                                    "source": "Web / Google Image Search",
                                })
                        except Exception:
                            continue
                else:
                    pattern2 = re.compile(
                        r'murl&quot;:&quot;(https://[^&]+?)&quot;.*?turl&quot;:&quot;(https://[^&]+?)&quot;.*?desc&quot;:&quot;(.*?)&quot;'
                    )
                    for murl, turl, desc in pattern2.findall(html):
                        if murl not in seen:
                            seen.add(murl)
                            results.append({
                                "url": murl,
                                "thumb_url": turl,
                                "title": desc or clean_query,
                                "source": "Web / Google Image Search",
                            })
        except Exception as e:
            logger.warning(f"Error querying web image engine: {e}")

        # 2. Supplementary search via Wikimedia Commons
        if len(results) < limit:
            try:
                wiki_url = (
                    f"https://commons.wikimedia.org/w/api.php?action=query&generator=search"
                    f"&gsrsearch={urllib.parse.quote(clean_query)}&gsrnamespace=6&gsrlimit=15"
                    f"&prop=imageinfo&iiprop=url&iiurlwidth=500&format=json"
                )
                wreq = urllib.request.Request(
                    wiki_url,
                    headers={"User-Agent": "HotelMenuApp/1.0 (contact@hotel.com)"},
                )
                with urllib.request.urlopen(wreq, timeout=5) as wresp:
                    wdata = json.loads(wresp.read().decode("utf-8"))
                    pages = wdata.get("query", {}).get("pages", {})
                    for pid, p in pages.items():
                        ii_list = p.get("imageinfo", [])
                        if ii_list:
                            ii = ii_list[0]
                            orig_url = ii.get("url")
                            thumb = ii.get("thumburl") or orig_url
                            title = p.get("title", "").replace("File:", "").split(".")[0]
                            if orig_url and orig_url not in seen:
                                seen.add(orig_url)
                                results.append({
                                    "url": orig_url,
                                    "thumb_url": thumb,
                                    "title": title,
                                    "source": "Wikimedia Commons",
                                })
            except Exception as e:
                logger.warning(f"Error querying Wikimedia images: {e}")

        return results[:limit]


image_search_service = ImageSearchService()
