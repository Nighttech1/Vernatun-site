"""Read-only public calendar projection of the authenticated EVENTS sheet.

No browser credential and no public mutation route. Source writes stay in the
private bot / Apps Script approval flow.
"""
from __future__ import annotations

import hashlib
import csv
import io
import os
import re
import threading
import time
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

EVENTS_CSV_URL = "https://docs.google.com/spreadsheets/d/1kOJ1CjMK5rNldM1IGNLdiVXqHTMeCuG35yP6_w6Y5Ls/export?format=csv&gid=711315998"
EVENT_HEADERS = ["Дата", "Время", "Тип мероприятия", "Описание", "Название", "Место", "Ссылка", "Статус", "Изображение", "_ID"]


class CalendarFeedError(Exception):
    """Safe, nonsecret public error code."""


def _text(value: object, limit: int, multiline: bool = False) -> str:
    if not isinstance(value, str) or len(value) > limit:
        return ""
    if any(ord(c) < 32 and not (multiline and c in "\n\t") for c in value):
        return ""
    return value.strip()


def _https_url(value: object, *, image: bool = False) -> str:
    text = _text(value, 2048)
    if not text:
        return ""
    if image and text.startswith("/images/") and not any(c in text for c in ("\\", "\r", "\n")) and ".." not in text:
        return text
    parsed = urlparse(text)
    return text if parsed.scheme == "https" and parsed.hostname and not parsed.username and not parsed.password else ""


def public_events(rows: object) -> list[dict]:
    if not isinstance(rows, list) or len(rows) > 500:
        raise CalendarFeedError("calendar_unavailable")
    result, ids = [], set()
    for row in rows:
        if not isinstance(row, dict) or row.get("status") != "Опубликовано":
            continue
        event_id = _text(row.get("id"), 80)
        day, start, end = row.get("date"), row.get("startTime"), row.get("endTime") or ""
        title, kind = _text(row.get("title"), 160), _text(row.get("kind"), 80)
        if event_id in ids:
            raise CalendarFeedError("calendar_unavailable")
        if not event_id or not re.fullmatch(r"[A-Za-z0-9_-]{1,80}", event_id) or not title or not kind:
            continue
        if not isinstance(day, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", day):
            continue
        try:
            date.fromisoformat(day)
        except ValueError:
            continue
        if not isinstance(start, str) or not re.fullmatch(r"(?:[01]\d|2[0-3]):[0-5]\d", start):
            continue
        if end and (not isinstance(end, str) or not re.fullmatch(r"(?:[01]\d|2[0-3]):[0-5]\d", end) or end < start):
            continue
        if row.get("timezone") != "Europe/Moscow":
            continue
        ids.add(event_id)
        result.append({
            "id": event_id, "date": day, "startTime": start, "endTime": end,
            "kind": kind, "title": title, "description": _text(row.get("description"), 4000, True),
            "location": _text(row.get("location"), 1000), "url": _https_url(row.get("url")),
            "image": _https_url(row.get("image"), image=True), "timezone": "Europe/Moscow",
        })
    return sorted(result, key=lambda event: (event["date"], event["startTime"], event["id"]))


def _get_csv(url: str) -> bytes:
    request = Request(url, headers={"Accept": "text/csv"}, method="GET")
    with urlopen(request, timeout=8) as response:
        raw = response.read(512_001)
    if len(raw) > 512_000:
        raise CalendarFeedError("calendar_unavailable")
    return raw


def events_from_csv(raw: bytes) -> list[dict]:
    if len(raw) > 512_000:
        raise CalendarFeedError("calendar_unavailable")
    try:
        rows = list(csv.reader(io.StringIO(raw.decode("utf-8-sig"))))
    except (UnicodeError, csv.Error):
        raise CalendarFeedError("calendar_unavailable") from None
    # The real sheet has a deliberately blank row1 and its established header row2.
    if rows and not any(cell.strip() for cell in rows[0]):
        rows = rows[1:]
    if not rows or len(rows) > 1000 or [cell.strip() for cell in rows[0][:10]] != EVENT_HEADERS or any(cell.strip() for cell in rows[0][10:]):
        raise CalendarFeedError("calendar_unavailable")
    result = []
    kinds = {"разговорный клуб": "talk", "разговорный": "talk", "танцы": "dance", "волейбол": "volleyball", "настольные игры": "tablegames", "другое": "other"}
    for values in rows[1:]:
        if not any(cell.strip() for cell in values):
            continue
        values = (values + [""] * 10)[:10]
        day, clock, kind, description, title, place, url, status, image, event_id = (cell.strip() for cell in values)
        match = re.fullmatch(r"(\d{2})\.(\d{2})\.(\d{2}|\d{4})", day)
        if match:
            d, m, y = match.groups()
            day = ("20" + y if len(y) == 2 else y) + "-" + m + "-" + d
        times = re.fullmatch(r"((?:[01]?\d|2[0-3]):[0-5]\d)(?:\s*[–—-]\s*((?:[01]?\d|2[0-3]):[0-5]\d))?", clock)
        start, end = ("", "") if not times else (times[1].zfill(5), (times[2] or "").zfill(5) if times[2] else "")
        result.append({"id": event_id, "date": day, "startTime": start, "endTime": end, "kind": kinds.get(kind.lower(), kind), "title": title, "description": description, "location": place, "url": url, "status": status, "image": image, "timezone": "Europe/Moscow"})
    return result


class CalendarFeed:
    def __init__(self, environ=None, transport=None, clock=None):
        self.environ = os.environ if environ is None else environ
        self.transport = _get_csv if transport is None else transport
        self.clock = time.monotonic if clock is None else clock
        self.lock = threading.Lock()
        self.cached = None
        self.expires = 0.0
        self.error_until = 0.0
        self.marker = None

    def _marker(self):
        name = self.environ.get("VERNATUN_EVENTS_CACHE_REVISION_PATH", "").strip()
        if not name:
            return None
        try:
            stat = Path(name).stat()
            return stat.st_ino, stat.st_mtime_ns, stat.st_size
        except OSError:
            return None

    def get(self, month: str = "") -> dict:
        if month and not re.fullmatch(r"\d{4}-(?:0[1-9]|1[0-2])", month):
            raise CalendarFeedError("invalid_month")
        # Fixed sheet + second-tab gid. Neither query parameters nor browser input can change it.
        url = EVENTS_CSV_URL
        marker = self._marker()
        with self.lock:
            if self.clock() < self.error_until:
                raise CalendarFeedError("calendar_unavailable")
            if self.cached is None or self.clock() >= self.expires or self.marker != marker:
                try:
                    raw = self.transport(url)
                    events = public_events(events_from_csv(raw))
                except Exception:
                    self.cached = None
                    self.expires = 0.0
                    self.error_until = self.clock() + 10.0
                    raise CalendarFeedError("calendar_unavailable") from None
                self.cached = {"ok": True, "source": "google_sheets", "timezone": "Europe/Moscow", "revision": hashlib.sha256(raw).hexdigest(), "updatedAt": datetime.now(timezone.utc).isoformat(), "events": events}
                self.expires, self.marker = self.clock() + 60.0, marker
                self.error_until = 0.0
            return {**self.cached, "events": [dict(row) for row in self.cached["events"] if not month or row["date"].startswith(month + "-")]}


calendar_feed = CalendarFeed()
