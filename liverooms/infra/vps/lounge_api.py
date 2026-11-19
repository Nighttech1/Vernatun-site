#!/usr/bin/env python3
"""Vernatun Lounge API: rooms, tokens, chat (until room empty), webhooks."""

from __future__ import annotations

import asyncio
import base64
import hashlib
import json
import os
import re
import secrets
import threading
import time
import unicodedata
import uuid
from datetime import timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from urllib.request import urlopen
from calendar_feed import CalendarFeedError, calendar_feed

API_KEY = os.environ["LIVEKIT_API_KEY"]
API_SECRET = os.environ["LIVEKIT_API_SECRET"]
# Client WebSocket URL: prefer LIVEKIT_PUBLIC_URL (browser-reachable),
# not internal LIVEKIT_URL / docker DNS. Fallback keeps prod hostname.
LIVEKIT_URL = os.environ.get(
    "LIVEKIT_PUBLIC_URL",
    os.environ.get("LIVEKIT_URL", "wss://vernatunspeakclub.com"),
)
LIVEKIT_HTTP = os.environ.get("LIVEKIT_HTTP_URL", "http://127.0.0.1:7880")
PORT = int(os.environ.get("MEET_PORT", "8765"))
BIND = os.environ.get("MEET_BIND", "127.0.0.1")
BASE = Path(__file__).resolve().parent
ROOMS_PATH = Path(os.environ.get("LOUNGE_ROOMS_PATH", str(BASE / "rooms.json")))
ROOMS_DYNAMIC_PATH = Path(
    os.environ.get("LOUNGE_ROOMS_DYNAMIC_PATH", str(BASE / "rooms_dynamic.json"))
)
CHAT_DIR = Path(os.environ.get("LOUNGE_CHAT_DIR", str(BASE / "chat")))
# Canon: Vernatun campus room materials (chat/session/uploads per room)
CAMPUS_DATA_ROOT = Path(
    os.environ.get(
        "LOUNGE_CAMPUS_DATA",
        str(BASE.parent.parent / "campus-data"),
    )
)
CAMPUS_ROOMS_DIR = CAMPUS_DATA_ROOT / "rooms"
CAMPUS_ROOMS_DIR.mkdir(parents=True, exist_ok=True)
# C-229: owner-editable keyword/regex samples for Campus Sentinels
SENTINEL_PATTERNS_PATH = Path(
    os.environ.get(
        "LOUNGE_SENTINEL_PATTERNS",
        str(CAMPUS_DATA_ROOT / "sentinel-patterns.json"),
    )
)
WEBHOOK_LOG = Path(os.environ.get("LOUNGE_WEBHOOK_LOG", str(BASE / "webhooks.log")))
_sentinel_patterns_lock = threading.Lock()
SESSION_EMPTY_SWEEP_SEC = int(os.environ.get("LOUNGE_SESSION_SWEEP_SEC", "20"))
CHAT_MAX = 200
OWNER_PASSWORD = os.environ.get("LOUNGE_OWNER_PASSWORD", "").strip()
INBOX_PATH = Path(os.environ.get("LOUNGE_INBOX_PATH", str(BASE / "owner_inbox.jsonl")))
SFU_ALERT_COOLDOWN_SEC = int(os.environ.get("LOUNGE_SFU_ALERT_COOLDOWN", "300"))
WEBHOOK_LOG_ALERT_BYTES = int(
    os.environ.get("LOUNGE_WEBHOOK_LOG_ALERT_BYTES", str(50 * 1024 * 1024))
)
# Phase 6 AI: optional; missing key → degraded stubs (HTTP 200, no 5xx storm).
OPENAI_API_KEY = (os.environ.get("OPENAI_API_KEY") or "").strip()
AI_CONSENT_LOG = Path(
    os.environ.get("LOUNGE_AI_CONSENT_LOG", str(BASE / "ai_consent.log"))
)
AI_PROMPTS_DIR = Path(
    os.environ.get(
        "LOUNGE_AI_PROMPTS_DIR",
        str(BASE.parent.parent / "ai" / "prompts"),
    )
)
STT_TEXT_MAX = 4000
COACH_TEXT_MAX = 2000
_last_sfu_alert_ts = 0
_last_disk_alert_ts = 0
_last_ice_alert_ts = 0
_sfu_was_up = True
ICE_FAIL_MARKERS = (
    "ice_failed",
    "ice failed",
    "connection_failed",
    "connectionquality_lost",
    "candidate_failed",
    "peerconnection_failed",
)

AHPERIK_RE = re.compile(r"ахперик\s+(\d+)", re.IGNORECASE)
NONAME_RE = re.compile(r"(?:noname|ахперик)[\s_-]*(\d+)", re.IGNORECASE)
SAFE_ROOM = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")
# C-190: short TTL cache for LiveKit participant counts (lobby was N sequential API calls).
_ONLINE_CACHE_TTL_SEC = float(os.environ.get("LOUNGE_ONLINE_CACHE_TTL", "8"))
_online_cache_lock = threading.Lock()
_online_cache: dict[str, tuple[float, int | None]] = {}

CHAT_DIR.mkdir(parents=True, exist_ok=True)
SESSION_DIR = Path(os.environ.get("LOUNGE_SESSION_DIR", str(BASE / "sessions")))
# Sessions live under campus-data/rooms/<id>/ when CAMPUS path is set
SESSION_DIR.mkdir(parents=True, exist_ok=True)
SESSION_DURATION_SEC = int(os.environ.get("LOUNGE_SESSION_DURATION_SEC", "5400"))  # 1.5h
MOD_LOG = Path(os.environ.get("LOUNGE_MOD_LOG", str(BASE / "moderation.log")))
TRUST_PATH = Path(os.environ.get("LOUNGE_TRUST_PATH", str(BASE / "trust.json")))
REPORT_LOG = Path(os.environ.get("LOUNGE_REPORT_LOG", str(BASE / "reports.log")))
TRUST_DEFAULT = 100
TRUST_PENALTY = 15
TRUST_ESCALATE_PENALTY = 25
TRUST_GATE_MIN = 40
GATED_CEFR = {"B1+", "B2", "C1", "C2"}
SAFE_CLIENT = re.compile(r"^[a-zA-Z0-9_-]{8,64}$")
ESCALATION_LOG = Path(
    os.environ.get("LOUNGE_ESCALATION_LOG", str(BASE / "escalation.log"))
)
# W-58 campus safety: append-only under campus-data (never wipe sputnik / memory_storage).
LEGAL_CONSENT_LOG = Path(
    os.environ.get(
        "LOUNGE_LEGAL_CONSENT_LOG",
        str(CAMPUS_DATA_ROOT / "legal_consent.log"),
    )
)
AUDIT_LOG = Path(
    os.environ.get("LOUNGE_AUDIT_LOG", str(CAMPUS_DATA_ROOT / "audit.log"))
)
EVIDENCE_DIR = Path(
    os.environ.get("LOUNGE_EVIDENCE_DIR", str(CAMPUS_DATA_ROOT / "evidence"))
)
EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
LEGAL_CONSENT_TTL_SEC = int(
    os.environ.get("LOUNGE_LEGAL_CONSENT_TTL_SEC", str(24 * 3600))
)
# W-61 variant A: bans by client_id and/or IP (append-only under campus-data).
BANS_LOG = Path(
    os.environ.get("LOUNGE_BANS_LOG", str(CAMPUS_DATA_ROOT / "bans.jsonl"))
)
# W-66 C-217: sentinel incidents (append-only). NEVER auto-ban / mute / trust from this log.
INCIDENTS_LOG = Path(
    os.environ.get(
        "LOUNGE_INCIDENTS_LOG", str(CAMPUS_DATA_ROOT / "incidents.jsonl")
    )
)
CLIENT_SEEN_LOG = Path(
    os.environ.get(
        "LOUNGE_CLIENT_SEEN_LOG", str(CAMPUS_DATA_ROOT / "client_seen.jsonl")
    )
)
BAN_DEFAULT_DAYS = int(os.environ.get("LOUNGE_BAN_DEFAULT_DAYS", "30"))
_client_seen_lock = threading.Lock()
_client_seen_mem: dict[str, dict] = {}
_bans_lock = threading.Lock()
_incidents_lock = threading.Lock()
SAFE_IP = re.compile(r"^[0-9a-fA-F.:]{3,80}$")
EVIDENCE_JPEG_MAX_B64 = int(
    os.environ.get("LOUNGE_EVIDENCE_JPEG_MAX_B64", str(200 * 1024))
)
# C-217 sentinel roles (API) ↔ architect sentinel_id (client)
SENTINEL_ROLES = frozenset({"POLITIC", "CENSOR", "NSFW", "HATE", "SHIELD"})
SENTINEL_ACTIONS = frozenset({"DELETED_SHAPE", "DELETED_CHAT", "FLAGGED"})
# Client architect ids: agenda/tone/canvas18; hate.sentinel→bounds; shield.sentinel→spam
SENTINEL_ID_TO_ROLE = {
    "agenda": "POLITIC",
    "politic": "POLITIC",
    "tone": "CENSOR",
    "censor": "CENSOR",
    "canvas18": "NSFW",
    "nsfw": "NSFW",
    "bounds": "HATE",
    "hate": "HATE",
    "spam": "SHIELD",
    "shield": "SHIELD",
}
SENTINEL_ROLE_TO_ID = {
    "POLITIC": "agenda",
    "CENSOR": "tone",
    "NSFW": "canvas18",
    "HATE": "bounds",
    "SHIELD": "spam",
}
SENTINEL_ROLE_BADGE = {
    "POLITIC": "Sentinel-Politic",
    "CENSOR": "Sentinel-Censor",
    "NSFW": "Sentinel-NSFW",
    "HATE": "Sentinel-Hate",
    "SHIELD": "Sentinel-Shield",
}
REPORT_AUTO_RESTRICT_THRESHOLD = int(
    os.environ.get("LOUNGE_REPORT_AUTO_RESTRICT_N", "3")
)
REASON_CODES = frozenset(
    {
        "POLITICAL_EXTREMISM",
        "NSFW_CANVAS",
        "OFFENSIVE_VOICE",
        "FLOOD_SPAM",
        "HARASSMENT",
        "DISCRIMINATION",
        "EXTREMISM",
        "BOARD_SABOTAGE",
        "NOISE_TROLLING",
        "ILLEGAL_CONTENT",
    }
)

# In-process session / consent / restrict state (process-local; append-only logs are durable).
_session_lock = threading.Lock()
_active_sessions: dict[tuple[str, str], dict] = {}
_legal_consent_lock = threading.Lock()
_legal_consent_mem: dict[str, dict] = {}
_auto_restrict_lock = threading.Lock()
_auto_restrict: dict[tuple[str, str], dict] = {}
_report_reporters: dict[tuple[str, str], set[str]] = {}

# Keyword toxicity stub (no model). Case-insensitive substring match.
TOXICITY_KEYWORDS = (
    "убить",
    "сдохн",
    "идиот",
    "дебил",
    "мудак",
    "тварь",
    "idiot",
    "fuck you",
    "kill yourself",
    "kys",
    "nigger",
    "faggot",
)

# Common fillers for heuristic coach when LLM unavailable.
FILLER_MAP = {
    "эээ": ["ну", "итак"],
    "эм": ["ну", "значит"],
    "типа": ["например", "вроде"],
    "как бы": ["пожалуй", ""],
    "ну вот": ["итак", ""],
    "короче": ["итак", "в общем"],
    "um": ["so", "well"],
    "uh": ["well", ""],
    "like": ["for example", ""],
    "you know": ["", ""],
    "basically": ["in short", ""],
}


def load_trust() -> dict:
    if not TRUST_PATH.is_file():
        return {}
    try:
        data = json.loads(TRUST_PATH.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def save_trust(data: dict) -> None:
    TRUST_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def get_trust(client_id: str) -> int:
    if not client_id:
        return TRUST_DEFAULT
    row = load_trust().get(client_id) or {}
    try:
        return int(row.get("score", TRUST_DEFAULT))
    except Exception:
        return TRUST_DEFAULT


def set_trust(client_id: str, score: int) -> int:
    score = max(0, min(100, int(score)))
    data = load_trust()
    data[client_id] = {"score": score, "updated": int(time.time())}
    save_trust(data)
    return score


def append_report(entry: dict) -> None:
    line = json.dumps({"ts": int(time.time()), **entry}, ensure_ascii=False)
    with REPORT_LOG.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def append_inbox(entry: dict) -> dict:
    """Append-only owner inbox (reports + SFU alerts). Never wipes file."""
    row = {
        "id": entry.get("id") or str(uuid.uuid4()),
        "ts": int(entry.get("ts") or time.time()),
        **{k: v for k, v in entry.items() if k not in ("id", "ts")},
    }
    with INBOX_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")
    return row


def read_inbox(limit: int = 100) -> list[dict]:
    if not INBOX_PATH.is_file():
        return []
    rows: list[dict] = []
    try:
        lines = INBOX_PATH.read_text(encoding="utf-8-sig").splitlines()
    except Exception:
        return []
    for line in reversed(lines):
        line = line.strip()
        if not line:
            continue
        try:
            rows.append(json.loads(line))
        except Exception:
            continue
        if len(rows) >= limit:
            break
    return rows


def read_mod_log(limit: int = 100) -> list[dict]:
    """Read-only tail of moderation.log (newest first). Never truncates."""
    if not MOD_LOG.is_file():
        return []
    rows: list[dict] = []
    try:
        lines = MOD_LOG.read_text(encoding="utf-8-sig").splitlines()
    except Exception:
        return []
    for line in reversed(lines):
        line = line.strip()
        if not line:
            continue
        try:
            rows.append(json.loads(line))
        except Exception:
            continue
        if len(rows) >= limit:
            break
    return rows


def _backup_data_file(path: Path) -> Path | None:
    """Copy before rewrite (data-safety). Returns backup path or None."""
    if not path.is_file():
        return None
    stamp = time.strftime("%Y%m%d%H%M%S")
    bak = path.with_name("%s.bak.%s" % (path.name, stamp))
    try:
        bak.write_bytes(path.read_bytes())
        return bak
    except Exception:
        return None


def _rewrite_jsonl(path: Path, keep_rows: list[dict]) -> int:
    """Rewrite jsonl from keep_rows (oldest→newest). Returns kept count."""
    _backup_data_file(path)
    text = ""
    for row in keep_rows:
        text += json.dumps(row, ensure_ascii=False) + "\n"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return len(keep_rows)


def _load_all_jsonl(path: Path) -> list[dict]:
    if not path.is_file():
        return []
    rows: list[dict] = []
    try:
        for line in path.read_text(encoding="utf-8-sig").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except Exception:
                continue
    except Exception:
        return []
    return rows


def mod_row_uid(row: dict) -> str:
    """Stable id for moderation.log rows (admin delete)."""
    return "mod-%s-%s-%s-%s" % (
        row.get("ts") or 0,
        row.get("action") or row.get("event") or "",
        row.get("target") or row.get("identity") or "",
        row.get("room") or "",
    )


def delete_inbox_by_ids(ids: list[str]) -> dict:
    """Remove inbox rows by id. Backs up file first."""
    want = {str(x) for x in ids if x}
    if not want:
        return {"removed": 0, "kept": 0}
    rows = _load_all_jsonl(INBOX_PATH)
    keep = [r for r in rows if str(r.get("id") or "") not in want]
    removed = len(rows) - len(keep)
    if removed:
        _rewrite_jsonl(INBOX_PATH, keep)
    return {"removed": removed, "kept": len(keep)}


def purge_inbox(*, older_than_days: int | None = None, kind: str | None = None) -> dict:
    """Delete inbox rows by age and/or kind. Backs up file first."""
    rows = _load_all_jsonl(INBOX_PATH)
    cutoff = None
    if older_than_days is not None and older_than_days >= 0:
        cutoff = int(time.time()) - int(older_than_days) * 86400
    kind_f = (kind or "").strip().lower() or None
    keep: list[dict] = []
    for r in rows:
        k = str(r.get("kind") or "").lower()
        ts = int(r.get("ts") or 0)
        drop = False
        if older_than_days is None and not kind_f:
            drop = True
        elif older_than_days is not None and kind_f:
            drop = k == kind_f and ts < cutoff  # type: ignore[operator]
        elif older_than_days is not None:
            drop = ts < cutoff  # type: ignore[operator]
        else:
            drop = k == kind_f
        if not drop:
            keep.append(r)
    removed = len(rows) - len(keep)
    if removed:
        _rewrite_jsonl(INBOX_PATH, keep)
    return {"removed": removed, "kept": len(keep)}


def delete_mod_by_uids(uids: list[str]) -> dict:
    want = {str(x) for x in uids if x}
    if not want:
        return {"removed": 0, "kept": 0}
    rows = _load_all_jsonl(MOD_LOG)
    keep = [r for r in rows if mod_row_uid(r) not in want]
    removed = len(rows) - len(keep)
    if removed:
        _rewrite_jsonl(MOD_LOG, keep)
    return {"removed": removed, "kept": len(keep)}


def purge_mod_log(*, older_than_days: int | None = None) -> dict:
    rows = _load_all_jsonl(MOD_LOG)
    if older_than_days is None:
        keep: list[dict] = []
    else:
        cutoff = int(time.time()) - int(older_than_days) * 86400
        keep = [r for r in rows if int(r.get("ts") or 0) >= cutoff]
    removed = len(rows) - len(keep)
    if removed:
        _rewrite_jsonl(MOD_LOG, keep)
    return {"removed": removed, "kept": len(keep)}


def normalize_sentinel_role(
    sentinel_role: str = "", sentinel_id: str = ""
) -> str | None:
    """Return POLITIC|CENSOR|NSFW|HATE|SHIELD or None if unknown."""
    role = (sentinel_role or "").strip().upper()
    if role in SENTINEL_ROLES:
        return role
    sid = (sentinel_id or "").strip().lower()
    if sid in SENTINEL_ID_TO_ROLE:
        return SENTINEL_ID_TO_ROLE[sid]
    # Also accept role-like ids
    if sid.upper() in SENTINEL_ROLES:
        return sid.upper()
    return None


def incident_badge(role: str) -> str:
    return SENTINEL_ROLE_BADGE.get((role or "").upper(), "Sentinel")


def append_incident(entry: dict) -> dict:
    """
    Append-only sentinel incident. HARD RULE: never bans, mutes, or changes trust.
    Callers must not invoke create_ban / set_trust / restrict from this path.
    """
    incident_id = str(entry.get("id") or entry.get("incident_id") or ("inc_" + uuid.uuid4().hex[:12]))
    row = {
        "id": incident_id,
        "incident_id": incident_id,
        "ts": int(entry.get("ts") or time.time()),
        "kind": "sentinel_incident",
        "event": "SENTINEL_INCIDENT",
        **{k: v for k, v in entry.items() if k not in ("id", "incident_id", "ts")},
    }
    INCIDENTS_LOG.parent.mkdir(parents=True, exist_ok=True)
    with _incidents_lock:
        with INCIDENTS_LOG.open("a", encoding="utf-8") as f:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    return row


def read_incidents(limit: int = 100) -> list[dict]:
    """Newest-first tail of incidents.jsonl. Never truncates."""
    if not INCIDENTS_LOG.is_file():
        return []
    rows: list[dict] = []
    try:
        lines = INCIDENTS_LOG.read_text(encoding="utf-8-sig").splitlines()
    except Exception:
        return []
    for line in reversed(lines):
        line = line.strip()
        if not line:
            continue
        try:
            rows.append(json.loads(line))
        except Exception:
            continue
        if len(rows) >= limit:
            break
    return rows


def incident_as_mod_item(row: dict) -> dict:
    """Shape incident for Moderation feed (merged into /admin/moderation)."""
    role = str(row.get("sentinel_role") or "").upper()
    badge = incident_badge(role)
    nick = str(row.get("author_nickname") or row.get("identity") or "")[:80]
    room = str(row.get("room_id") or row.get("room") or "")[:64]
    reason = str(row.get("reason") or row.get("snippet") or "")[:500]
    action = str(row.get("action_taken") or "FLAGGED")
    return {
        **row,
        "event": "SENTINEL_INCIDENT",
        "kind": "sentinel_incident",
        "action": "SENTINEL_INCIDENT",
        "room": room,
        "target": nick or str(row.get("author_client_id") or ""),
        "identity": nick,
        "target_identity": nick,
        "target_client_id": str(
            row.get("author_client_id") or row.get("client_id") or ""
        ),
        "ip": str(row.get("author_ip") or row.get("ip") or "") or None,
        "reason": reason,
        "body": reason,
        "title": "%s · %s" % (badge, nick or room or "инцидент"),
        "sentinel_badge": badge,
        "action_taken": action,
    }


def delete_incidents_by_ids(ids: list[str]) -> dict:
    """Remove incident rows by id / incident_id. Backs up file first."""
    want = {str(x) for x in ids if x}
    if not want:
        return {"removed": 0, "kept": 0}
    rows = _load_all_jsonl(INCIDENTS_LOG)
    keep = [
        r
        for r in rows
        if str(r.get("id") or "") not in want
        and str(r.get("incident_id") or "") not in want
    ]
    removed = len(rows) - len(keep)
    if removed:
        _rewrite_jsonl(INCIDENTS_LOG, keep)
    return {"removed": removed, "kept": len(keep)}


def load_evidence(evidence_id: str) -> dict | None:
    eid = (evidence_id or "").strip()
    if not eid or not re.match(r"^[a-fA-F0-9-]{8,64}$", eid):
        return None
    path = EVIDENCE_DIR / ("%s.json" % eid)
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def owner_password_ok(header_val: str) -> bool:
    if not OWNER_PASSWORD:
        return False
    return secrets.compare_digest(header_val.strip(), OWNER_PASSWORD)


def hash_room_password(plain: str) -> str:
    salt = secrets.token_hex(8)
    digest = hashlib.sha256((salt + plain).encode("utf-8")).hexdigest()
    return "%s$%s" % (salt, digest)


def check_room_password(stored: str, plain: str) -> bool:
    if not stored:
        return True
    if not plain:
        return False
    if "$" not in stored:
        return secrets.compare_digest(stored, plain)
    salt, digest = stored.split("$", 1)
    try:
        return secrets.compare_digest(
            hashlib.sha256((salt + plain).encode("utf-8")).hexdigest(), digest
        )
    except Exception:
        return False


def load_seed_rooms() -> list[dict]:
    if not ROOMS_PATH.is_file():
        return []
    try:
        data = json.loads(ROOMS_PATH.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except Exception:
        return []


def load_dynamic_rooms() -> list[dict]:
    if not ROOMS_DYNAMIC_PATH.is_file():
        return []
    try:
        data = json.loads(ROOMS_DYNAMIC_PATH.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except Exception:
        return []


def save_dynamic_rooms(rooms: list[dict]) -> None:
    ROOMS_DYNAMIC_PATH.write_text(
        json.dumps(rooms, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def load_rooms() -> list[dict]:
    """Pilot catalog = seed rooms only (exactly rooms.json).

    Dynamic merge is off while POST /rooms returns create_disabled.
    Set LOUNGE_ROOMS_DYNAMIC_ENABLED=1 to re-enable seed+dynamic merge
    (dynamic wins on same id). rooms_dynamic.json stays [] for the pilot.
    """
    by_id: dict[str, dict] = {}
    for r in load_seed_rooms():
        rid = r.get("id")
        if rid:
            by_id[str(rid)] = r
    if os.environ.get("LOUNGE_ROOMS_DYNAMIC_ENABLED", "").strip().lower() in (
        "1",
        "true",
        "yes",
    ):
        for r in load_dynamic_rooms():
            rid = r.get("id")
            if rid:
                by_id[str(rid)] = r
    return list(by_id.values())


def public_room_view(r: dict) -> dict:
    """Strip password hash from API responses."""
    out = {k: v for k, v in r.items() if k != "password_hash"}
    out["locked"] = bool(r.get("password_hash") or r.get("locked"))
    return out


def create_room(
    room_id: str,
    title: str,
    cefr: str,
    description: str,
    password: str,
) -> dict:
    """Unused while public create is disabled (HTTP 403 create_disabled)."""
    if not SAFE_ROOM.match(room_id):
        raise ValueError("bad_room_id")
    if room_by_id(room_id):
        raise ValueError("room_exists")
    title = (title or "").strip()[:80]
    if len(title) < 2:
        raise ValueError("bad_title")
    cefr = (cefr or "any").strip()[:8] or "any"
    description = (description or "").strip()[:200]
    row = {
        "id": room_id,
        "title": title,
        "cefr": cefr,
        "description": description or "Комната участников",
        "locked": bool(password),
    }
    if password:
        row["password_hash"] = hash_room_password(password)
    rooms = load_dynamic_rooms()
    rooms.append(row)
    save_dynamic_rooms(rooms)
    return public_room_view(row)


def livekit_http_ok() -> bool:
    try:
        with urlopen(LIVEKIT_HTTP + "/", timeout=3) as resp:  # noqa: S310
            return 200 <= int(getattr(resp, "status", 200) or 200) < 500
    except Exception:
        try:
            with urlopen(LIVEKIT_HTTP, timeout=3) as resp:  # noqa: S310
                return True
        except Exception:
            return False


def maybe_emit_sfu_alert() -> None:
    global _last_sfu_alert_ts, _sfu_was_up
    ok = livekit_http_ok()
    now = int(time.time())
    if ok:
        if not _sfu_was_up:
            append_inbox(
                {
                    "kind": "alert",
                    "title": "SFU recovered",
                    "body": "LiveKit HTTP снова отвечает (%s)" % LIVEKIT_HTTP,
                    "room": "",
                    "meta": {"source": "health_poll"},
                }
            )
        _sfu_was_up = True
        return
    _sfu_was_up = False
    if now - _last_sfu_alert_ts < SFU_ALERT_COOLDOWN_SEC:
        return
    _last_sfu_alert_ts = now
    append_inbox(
        {
            "kind": "alert",
            "title": "SFU down",
            "body": "LiveKit HTTP не отвечает (%s). Комнаты могут молчать."
            % LIVEKIT_HTTP,
            "room": "",
            "meta": {"source": "health_poll", "url": LIVEKIT_HTTP},
        }
    )


def maybe_emit_webhook_disk_alert() -> None:
    global _last_disk_alert_ts
    if not WEBHOOK_LOG.is_file():
        return
    try:
        size = WEBHOOK_LOG.stat().st_size
    except Exception:
        return
    if size < WEBHOOK_LOG_ALERT_BYTES:
        return
    now = int(time.time())
    if now - _last_disk_alert_ts < SFU_ALERT_COOLDOWN_SEC:
        return
    _last_disk_alert_ts = now
    mb = round(size / (1024 * 1024), 1)
    append_inbox(
        {
            "kind": "alert",
            "title": "webhook_log_large",
            "body": "Файл webhooks.log вырос до ~%s МБ. Ротация вручную без wipe других данных."
            % mb,
            "room": "",
            "meta": {
                "source": "disk_watch",
                "bytes": size,
                "path": str(WEBHOOK_LOG),
            },
        }
    )


def maybe_emit_ice_alert_from_webhook(body_text: str) -> None:
    global _last_ice_alert_ts
    low = (body_text or "").lower()
    if not any(m in low for m in ICE_FAIL_MARKERS):
        return
    now = int(time.time())
    if now - _last_ice_alert_ts < SFU_ALERT_COOLDOWN_SEC:
        return
    _last_ice_alert_ts = now
    append_inbox(
        {
            "kind": "alert",
            "title": "ice_errors",
            "body": "В webhook LiveKit замечены маркеры ICE/connection fail. Проверьте TURN и сеть.",
            "room": "",
            "meta": {"source": "webhook_parse", "snippet": body_text[:240]},
        }
    )


def sfu_watch_loop() -> None:
    while True:
        try:
            maybe_emit_sfu_alert()
            maybe_emit_webhook_disk_alert()
        except Exception:
            pass
        time.sleep(60)


def default_sentinel_patterns() -> dict:
    """Seed patterns (client defaults mirrored for owner editing)."""
    return {
        "agenda": {
            "label": "Политика / агитация",
            "keywords": [
                "голосуй за",
                "партия ",
                "сша оккупа",
                "нато ",
                "зеленск",
                "путин",
                "трамп",
                "байден",
                "война с",
                "спецоперац",
                "фашист",
                "нацист",
                "геноцид",
                "референдум",
                "политическ",
                "propaganda",
                "vote for",
                "political party",
            ],
            "patterns": [
                r"\b(z[\W_]*о[\W_]*в)\b",
                r"\b(slava\s+ukrain)",
                r"\b(russia\s+is\s+terror)",
            ],
        },
        "tone": {
            "label": "Тон / оскорбления",
            "keywords": [
                "бляд",
                "хуй",
                "хуе",
                "пизд",
                "ебан",
                "ебат",
                "ёбан",
                "сука",
                "мудак",
                "дебил",
                "идиот",
                "fuck",
                "shit",
                "bitch",
                "asshole",
                "cunt",
                "dick",
            ],
            "patterns": [],
        },
        "bounds": {
            "label": "Границы / hate",
            "keywords": [
                "жид",
                "хач",
                "чурк",
                "нигер",
                "nigger",
                "nigga",
                "kike",
                "faggot",
                "пидор",
                "пидар",
                "гомик",
                "свинособ",
                "унтерменш",
                "14/88",
                "1488",
                "напиши в лс",
                "пиши в лс",
                "в личку",
                "скинь номер",
                "твой адрес",
                "домашний адрес",
            ],
            "patterns": [
                r"\b88\b",
                r"\b14\s*/\s*88\b",
                r"(?:\+?\d[\d\s\-()]{8,}\d)",
            ],
        },
        "spam": {
            "label": "Спам / ссылки",
            "keywords": [
                "заработок без",
                "крипта халява",
                "бесплатные деньги",
                "переходи по ссылке",
                "click here now",
                "crypto giveaway",
            ],
            "patterns": [
                r"(?:https?://|www\.)[^\s]+",
                r"(?:t\.me|telegram\.me|discord\.gg|bit\.ly)/[^\s]+",
            ],
        },
        "canvas18": {
            "label": "18+ / NSFW (текст)",
            "keywords": [],
            "patterns": [],
        },
    }


def load_sentinel_patterns() -> dict:
    with _sentinel_patterns_lock:
        if SENTINEL_PATTERNS_PATH.is_file():
            try:
                data = json.loads(
                    SENTINEL_PATTERNS_PATH.read_text(encoding="utf-8")
                )
                if isinstance(data, dict) and data:
                    # merge missing keys from defaults
                    base = default_sentinel_patterns()
                    for k, v in data.items():
                        if isinstance(v, dict):
                            base[k] = {
                                "label": str(
                                    v.get("label")
                                    or base.get(k, {}).get("label")
                                    or k
                                ),
                                "keywords": [
                                    str(x)
                                    for x in (v.get("keywords") or [])
                                    if str(x).strip()
                                ][:500],
                                "patterns": [
                                    str(x)
                                    for x in (v.get("patterns") or [])
                                    if str(x).strip()
                                ][:200],
                            }
                    return base
            except Exception as e:  # noqa: BLE001
                print("load_sentinel_patterns:", e)
        return default_sentinel_patterns()


def save_sentinel_patterns(data: dict) -> dict:
    allowed = ("agenda", "tone", "bounds", "spam", "canvas18")
    cleaned = default_sentinel_patterns()
    if isinstance(data, dict):
        for k in allowed:
            v = data.get(k)
            if not isinstance(v, dict):
                continue
            cleaned[k] = {
                "label": str(v.get("label") or cleaned[k].get("label") or k)[:80],
                "keywords": [
                    str(x).strip()[:120]
                    for x in (v.get("keywords") or [])
                    if str(x).strip()
                ][:500],
                "patterns": [
                    str(x).strip()[:200]
                    for x in (v.get("patterns") or [])
                    if str(x).strip()
                ][:200],
            }
    CAMPUS_DATA_ROOT.mkdir(parents=True, exist_ok=True)
    with _sentinel_patterns_lock:
        SENTINEL_PATTERNS_PATH.write_text(
            json.dumps(cleaned, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    return cleaned


def invalidate_online_cache(room_id: str) -> None:
    with _online_cache_lock:
        _online_cache.pop(room_id, None)


def list_session_room_ids() -> list[str]:
    """Room ids that currently have a session.json on disk."""
    out: list[str] = []
    try:
        if not CAMPUS_ROOMS_DIR.is_dir():
            return out
        for d in CAMPUS_ROOMS_DIR.iterdir():
            if d.is_dir() and (d / "session.json").is_file():
                rid = d.name
                if SAFE_ROOM.match(rid):
                    out.append(rid)
    except Exception as e:  # noqa: BLE001
        print("list_session_room_ids:", e)
    return out


def delete_livekit_room(room_id: str) -> bool:
    """C-231: force-close LiveKit room so clients disconnect on session end."""
    from livekit import api

    if not room_id or not SAFE_ROOM.match(room_id):
        return False

    async def _run() -> None:
        lk = api.LiveKitAPI(LIVEKIT_HTTP, API_KEY, API_SECRET)
        try:
            await lk.room.delete_room(api.DeleteRoomRequest(room=room_id))
        finally:
            await lk.aclose()

    try:
        asyncio.run(_run())
        invalidate_online_cache(room_id)
        return True
    except Exception as e:  # noqa: BLE001
        print("delete_livekit_room failed:", e)
        return False


def session_empty_sweeper_loop() -> None:
    """C-230/C-255: if LiveKit confirms 0 participants, end session + wipe."""
    while True:
        try:
            for rid in list_session_room_ids():
                try:
                    # After grace window, force so timer cannot stick forever
                    cur = load_session(rid)
                    started = int((cur or {}).get("startedAt") or 0)
                    aged = (
                        started
                        and (int(time.time()) - started) >= EMPTY_SESSION_GRACE_SEC
                    )
                    maybe_clear_chat(rid, force=bool(aged))
                except Exception as e:  # noqa: BLE001
                    print("session_empty_sweeper room=%s:" % rid, e)
        except Exception as e:  # noqa: BLE001
            print("session_empty_sweeper:", e)
        time.sleep(max(5, SESSION_EMPTY_SWEEP_SEC))


def room_requires_trust(meta: dict) -> bool:
    cefr = str(meta.get("cefr") or "")
    return cefr in GATED_CEFR


def room_by_id(room_id: str) -> dict | None:
    for r in load_rooms():
        if r.get("id") == room_id:
            return r
    return None


def room_data_dir(room_id: str) -> Path:
    if not SAFE_ROOM.match(room_id or ""):
        raise ValueError("bad_room_id")
    d = CAMPUS_ROOMS_DIR / room_id
    d.mkdir(parents=True, exist_ok=True)
    (d / "uploads").mkdir(parents=True, exist_ok=True)
    return d


def chat_path(room_id: str) -> Path:
    return room_data_dir(room_id) / "chat.json"


def session_path(room_id: str) -> Path:
    return room_data_dir(room_id) / "session.json"


def livekit_online(room_id: str) -> int | None:
    """Participant count, or None if LiveKit API is unreachable (do not treat as empty)."""
    with _online_cache_lock:
        hit = _online_cache.get(room_id)
        if hit and (time.time() - hit[0]) <= _ONLINE_CACHE_TTL_SEC:
            return hit[1]

    from livekit import api

    async def _run() -> int:
        lk = api.LiveKitAPI(LIVEKIT_HTTP, API_KEY, API_SECRET)
        try:
            res = await lk.room.list_participants(api.ListParticipantsRequest(room=room_id))
            return len(res.participants or [])
        finally:
            await lk.aclose()

    try:
        n = asyncio.run(_run())
    except Exception:
        n = None
    with _online_cache_lock:
        _online_cache[room_id] = (time.time(), n)
    return n


def livekit_online_map(room_ids: list[str]) -> dict[str, int]:
    """One LiveKit client: fetch counts for many rooms in parallel. Uses TTL cache."""
    now = time.time()
    out: dict[str, int] = {}
    need: list[str] = []
    with _online_cache_lock:
        for rid in room_ids:
            hit = _online_cache.get(rid)
            if hit and (now - hit[0]) <= _ONLINE_CACHE_TTL_SEC:
                out[rid] = int(hit[1] or 0)
            else:
                need.append(rid)
    if not need:
        return out

    from livekit import api

    async def _run() -> dict[str, int | None]:
        lk = api.LiveKitAPI(LIVEKIT_HTTP, API_KEY, API_SECRET)
        result: dict[str, int | None] = {}

        async def one(rid: str) -> None:
            try:
                res = await lk.room.list_participants(
                    api.ListParticipantsRequest(room=rid)
                )
                result[rid] = len(res.participants or [])
            except Exception:
                result[rid] = None

        try:
            await asyncio.gather(*[one(rid) for rid in need])
        finally:
            await lk.aclose()
        return result

    try:
        fetched = asyncio.run(_run())
    except Exception:
        fetched = {rid: None for rid in need}

    ts = time.time()
    with _online_cache_lock:
        for rid, n in fetched.items():
            _online_cache[rid] = (ts, n)
            out[rid] = int(n or 0)
    return out


# C-255: short join-race grace only (was 90s → empty rooms kept timer forever)
EMPTY_SESSION_GRACE_SEC = int(os.environ.get("LOUNGE_EMPTY_GRACE_SEC", "20"))


def maybe_clear_chat(room_id: str, *, force: bool = False) -> None:
    """End session when LiveKit confirms 0 participants (never on API errors).

    C-241/C-255: brief grace after session start for ICE join race.
    force=True (leave webhook / vacate / lobby poll) skips grace when empty.
    """
    invalidate_online_cache(room_id)
    online = livekit_online(room_id)
    if online is None or online > 0:
        return
    cur = load_session(room_id)
    if cur and not force:
        started = int(cur.get("startedAt") or 0)
        if started and (int(time.time()) - started) < EMPTY_SESSION_GRACE_SEC:
            return
    end_room_session(room_id, reason="empty")


def schedule_empty_check(room_id: str, delay_sec: float = 2.5) -> None:
    """C-255: after leave, wait briefly for LiveKit roster to settle, then force wipe."""

    def _run() -> None:
        try:
            time.sleep(max(0.5, delay_sec))
            maybe_clear_chat(room_id, force=True)
        except Exception as e:  # noqa: BLE001
            print("schedule_empty_check:", e)

    threading.Thread(target=_run, name="empty-check-%s" % room_id, daemon=True).start()


# LiveKit webhook may send string names or protobuf numeric enums
_LK_LEAVE_EVENTS = frozenset(
    {
        "room_finished",
        "participant_left",
        "participant_disconnected",
        "3",  # ROOM_FINISHED
        "2",  # PARTICIPANT_LEFT
    }
)
_LK_LEAVE_EVENT_NUMS = frozenset({2, 3})


def is_livekit_leave_event(event: object) -> bool:
    if event is None:
        return False
    if isinstance(event, int):
        return event in _LK_LEAVE_EVENT_NUMS
    s = str(event).strip().lower()
    return s in _LK_LEAVE_EVENTS or s.isdigit() and int(s) in _LK_LEAVE_EVENT_NUMS


def vacate_room_session(
    room_id: str, identity: str = "", *, force_empty: bool = False
) -> dict:
    """C-255: client leave ping — drop participant, then end session if empty.

    force_empty=True when the SPA knew it was the last human in the room
    (closes LiveKit even if a ghost participant remains).
    """
    if not room_id or not SAFE_ROOM.match(room_id):
        return {"ok": False, "error": "bad_room"}
    removed = False
    if identity:
        removed = remove_livekit_participant(room_id, identity)
    invalidate_online_cache(room_id)
    online = livekit_online(room_id)
    if force_empty or (online is not None and online <= 0):
        # Nuclear close: wipe session + DeleteRoom (clears LiveKit ghosts)
        end_room_session(room_id, reason="vacate" if not force_empty else "vacate_last")
        return {
            "ok": True,
            "ended": True,
            "online": 0,
            "removed": removed,
            "force_empty": force_empty,
        }
    # Roster may lag one tick after remove — force-check shortly
    schedule_empty_check(room_id, 1.2)
    return {
        "ok": True,
        "ended": False,
        "online": int(online or 0),
        "removed": removed,
        "force_empty": False,
    }


def load_session(room_id: str) -> dict | None:
    path = session_path(room_id)
    if not path.is_file():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else None
    except Exception:
        return None


def save_session(room_id: str, data: dict) -> None:
    session_path(room_id).write_text(
        json.dumps(data, ensure_ascii=False, indent=0), encoding="utf-8"
    )


def end_room_session(room_id: str, reason: str = "empty") -> dict:
    """Wipe chat + board media for this session. Room catalog entry stays."""
    path = chat_path(room_id)
    if path.is_file():
        path.unlink()
    try:
        from spacedeck_client import purge_board

        purge_board(room_id)
    except Exception as e:  # noqa: BLE001
        print("purge_board failed:", e)
    sp = session_path(room_id)
    if sp.is_file():
        sp.unlink()
    # wipe uploads for ended session (keep directory)
    try:
        up = room_data_dir(room_id) / "uploads"
        if up.is_dir():
            for f in up.iterdir():
                if f.is_file():
                    f.unlink()
    except Exception as e:  # noqa: BLE001
        print("uploads wipe failed:", e)
    # C-231: disconnect everyone still in LiveKit for this room
    try:
        delete_livekit_room(room_id)
    except Exception as e:  # noqa: BLE001
        print("end_room_session delete_livekit:", e)
    print(f"session_ended room={room_id} reason={reason}")
    return {"ok": True, "ended": True, "reason": reason}


def ensure_session_started(room_id: str) -> dict:
    """Start or refresh 1.5h session. Expire if past endsAt."""
    now = int(time.time())
    cur = load_session(room_id)
    if cur:
        ends = int(cur.get("endsAt") or 0)
        if ends and now >= ends:
            end_room_session(room_id, reason="timeout")
            cur = None
        else:
            remaining = max(0, ends - now)
            return {
                "ok": True,
                "active": True,
                "id": cur.get("id"),
                "startedAt": cur.get("startedAt"),
                "endsAt": ends,
                "remainingSec": remaining,
                "durationSec": SESSION_DURATION_SEC,
            }
    data = {
        "id": str(uuid.uuid4())[:12],
        "startedAt": now,
        "endsAt": now + SESSION_DURATION_SEC,
        "durationSec": SESSION_DURATION_SEC,
    }
    save_session(room_id, data)
    return {
        "ok": True,
        "active": True,
        "id": data["id"],
        "startedAt": data["startedAt"],
        "endsAt": data["endsAt"],
        "remainingSec": SESSION_DURATION_SEC,
        "durationSec": SESSION_DURATION_SEC,
    }


def get_session_status(room_id: str) -> dict:
    now = int(time.time())
    cur = load_session(room_id)
    if not cur:
        return {
            "ok": True,
            "active": False,
            "remainingSec": 0,
            "durationSec": SESSION_DURATION_SEC,
        }
    ends = int(cur.get("endsAt") or 0)
    if ends and now >= ends:
        end_room_session(room_id, reason="timeout")
        return {
            "ok": True,
            "active": False,
            "ended": True,
            "reason": "timeout",
            "remainingSec": 0,
            "durationSec": SESSION_DURATION_SEC,
        }
    return {
        "ok": True,
        "active": True,
        "id": cur.get("id"),
        "startedAt": cur.get("startedAt"),
        "endsAt": ends,
        "remainingSec": max(0, ends - now),
        "durationSec": SESSION_DURATION_SEC,
    }


def load_chat_file(room_id: str) -> list[dict]:
    path = chat_path(room_id)
    if not path.is_file():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except Exception:
        return []


def read_chat(room_id: str) -> list[dict]:
    maybe_clear_chat(room_id)
    return load_chat_file(room_id)


def append_chat(
    room_id: str,
    name: str,
    text: str,
    *,
    client_id: str = "",
    ip: str = "",
) -> dict:
    name = (name or "гость").strip()[:40] or "гость"
    raw = (text or "").strip()[:1000]
    if not raw:
        raise ValueError("empty_text")
    # C-240: owner keyword/regex samples → block + incident + kick
    owner_hit = owner_patterns_hit(raw)
    if owner_hit:
        sid, rule = owner_hit
        role = SENTINEL_ID_TO_ROLE_ENFORCE.get(sid, "CENSOR")
        try:
            append_incident(
                {
                    "room_id": room_id,
                    "room": room_id,
                    "sentinel_role": role,
                    "sentinel_id": sid,
                    "sentinel_badge": incident_badge(role),
                    "category": "chat",
                    "reason": "owner_pattern:%s" % rule,
                    "author_client_id": client_id or None,
                    "author_nickname": name,
                    "author_ip": ip or None,
                    "shape_ids": [],
                    "chat_snippet": raw[:500],
                    "action_taken": "DELETED_CHAT",
                    "source": "owner_patterns",
                    "auto_ban": False,
                    "auto_mute": False,
                    "trust_delta": 0,
                    "enforced_kick": True,
                }
            )
        except Exception:
            pass
        append_audit(
            {
                "event": "CHAT_OWNER_PATTERN",
                "code": rule,
                "room": room_id,
                "client_id": client_id,
                "ip": ip,
                "sha256": hashlib.sha256(raw.encode("utf-8")).hexdigest(),
            }
        )
        raise ValueError("BLOCKED_OWNER_PATTERN")
    result = validate_and_sanitize(raw)
    if result.get("blocked"):
        append_audit(
            {
                "event": "CHAT_BLOCKED",
                "code": result.get("code") or "BLOCKED_EXTREMISM_DETECTED",
                "room": room_id,
                "client_id": client_id,
                "ip": ip,
                "sha256": hashlib.sha256(raw.encode("utf-8")).hexdigest(),
            }
        )
        # C-217 optional server scan: log incident only — NEVER ban/mute/trust.
        try:
            append_incident(
                {
                    "room_id": room_id,
                    "room": room_id,
                    "sentinel_role": "POLITIC",
                    "sentinel_id": "agenda",
                    "sentinel_badge": incident_badge("POLITIC"),
                    "category": "chat",
                    "reason": "server_chat_blocked",
                    "author_client_id": client_id or None,
                    "author_nickname": name,
                    "author_ip": ip or None,
                    "shape_ids": [],
                    "chat_snippet": raw[:500],
                    "action_taken": "FLAGGED",
                    "source": "server_chat_scan",
                    "auto_ban": False,
                    "auto_mute": False,
                    "trust_delta": 0,
                }
            )
        except Exception:
            pass
        raise ValueError("BLOCKED_EXTREMISM_DETECTED")
    text_out = str(result.get("text") or "")
    censored = bool(result.get("censored"))
    if censored:
        append_audit(
            {
                "event": "CHAT_CENSORED",
                "code": "CENSORED",
                "room": room_id,
                "client_id": client_id,
                "ip": ip,
                "sha256": hashlib.sha256(raw.encode("utf-8")).hexdigest(),
            }
        )
        # C-217 optional server scan: emit CENSOR incident, no kick/ban.
        try:
            append_incident(
                {
                    "room_id": room_id,
                    "room": room_id,
                    "sentinel_role": "CENSOR",
                    "sentinel_id": "tone",
                    "sentinel_badge": incident_badge("CENSOR"),
                    "category": "chat",
                    "reason": "server_chat_censored",
                    "author_client_id": client_id or None,
                    "author_nickname": name,
                    "author_ip": ip or None,
                    "shape_ids": [],
                    "chat_snippet": raw[:500],
                    "action_taken": "FLAGGED",
                    "source": "server_chat_scan",
                    "auto_ban": False,
                    "auto_mute": False,
                    "trust_delta": 0,
                }
            )
        except Exception:
            pass
    if not text_out.strip():
        raise ValueError("empty_text")
    msg = {
        "id": str(uuid.uuid4())[:8],
        "name": name,
        "text": text_out,
        "ts": int(time.time()),
        "censored": censored,
    }
    path = chat_path(room_id)
    msgs = load_chat_file(room_id)
    msgs.append(msg)
    if len(msgs) > CHAT_MAX:
        msgs = msgs[-CHAT_MAX:]
    path.write_text(json.dumps(msgs, ensure_ascii=False, indent=0), encoding="utf-8")
    return msg


def next_noname(room_id: str) -> int:
    """Next free NonameN index in the room (also recognizes legacy ахперик N)."""
    from livekit import api

    async def _run() -> int:
        lk = api.LiveKitAPI(LIVEKIT_HTTP, API_KEY, API_SECRET)
        used: set[int] = set()
        try:
            res = await lk.room.list_participants(api.ListParticipantsRequest(room=room_id))
            for p in res.participants or []:
                for text in (p.name or "", p.identity or ""):
                    m = NONAME_RE.search(text)
                    if m:
                        used.add(int(m.group(1)))
                    else:
                        m2 = AHPERIK_RE.search(text)
                        if m2:
                            used.add(int(m2.group(1)))
        except Exception:
            pass
        finally:
            await lk.aclose()
        n = 1
        while n in used:
            n += 1
        return n

    try:
        return asyncio.run(_run())
    except Exception:
        return int(time.time()) % 900 + 1


# Back-compat alias
next_ahperik = next_noname


def sanitize_display_name(raw: str) -> str:
    """C-233: user-chosen nick for LiveKit token (2–40 chars)."""
    s = unicodedata.normalize("NFKC", (raw or "")).strip()
    s = re.sub(r"[\x00-\x1f\x7f]", "", s)
    s = re.sub(r"\s+", " ", s).strip()[:40]
    if len(s) < 2:
        return ""
    return s


def owner_patterns_hit(text: str) -> tuple[str, str] | None:
    """
    C-240: match chat/board text against owner-edited sentinel-patterns.json.
    Returns (sentinel_id, matched_rule) or None.
    """
    raw = (text or "").strip()
    if not raw:
        return None
    low = raw.lower()
    try:
        patterns = load_sentinel_patterns()
    except Exception:
        return None
    for sid, block in patterns.items():
        if not isinstance(block, dict):
            continue
        for kw in block.get("keywords") or []:
            k = str(kw).strip().lower()
            if k and k in low:
                return str(sid), f"kw:{kw}"
        for pat in block.get("patterns") or []:
            src = str(pat).strip()
            if not src:
                continue
            try:
                if re.search(src, raw, re.IGNORECASE):
                    return str(sid), f"re:{src[:80]}"
            except re.error:
                continue
    return None


SENTINEL_ID_TO_ROLE_ENFORCE = {
    "agenda": "POLITIC",
    "tone": "CENSOR",
    "canvas18": "NSFW",
    "bounds": "HATE",
    "spam": "SHIELD",
}


def make_token(
    identity: str,
    name: str,
    room_id: str,
    is_host: bool = False,
    client_id: str = "",
) -> str:
    from livekit import api

    grant = api.VideoGrants(
        room_join=True,
        room=room_id,
        can_publish=True,
        can_subscribe=True,
        can_publish_data=True,
        room_admin=bool(is_host),
    )
    meta_obj = {"role": "host" if is_host else "member"}
    if client_id:
        meta_obj["client_id"] = client_id
    meta = json.dumps(meta_obj, ensure_ascii=False)
    return (
        api.AccessToken(API_KEY, API_SECRET)
        .with_identity(identity)
        .with_name(name)
        .with_metadata(meta)
        .with_grants(grant)
        .with_ttl(timedelta(hours=2))
        .to_jwt()
    )


def participant_role(room_id: str, identity: str) -> str:
    """Return 'host' | 'member' | '' from LiveKit participant metadata."""
    from livekit import api

    async def _run() -> str:
        lk = api.LiveKitAPI(LIVEKIT_HTTP, API_KEY, API_SECRET)
        try:
            res = await lk.room.list_participants(api.ListParticipantsRequest(room=room_id))
            for p in res.participants or []:
                if (p.identity or "") != identity:
                    continue
                try:
                    meta = json.loads(p.metadata or "{}")
                except Exception:
                    meta = {}
                role = str(meta.get("role") or "")
                if role == "host":
                    return "host"
                # room_admin grant is not always visible; metadata is source of truth
                return role or "member"
        except Exception:
            return ""
        finally:
            await lk.aclose()
        return ""

    try:
        return asyncio.run(_run())
    except Exception:
        return ""


def append_mod_log(entry: dict) -> None:
    line = json.dumps({"ts": int(time.time()), **entry}, ensure_ascii=False)
    with MOD_LOG.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def append_escalation(entry: dict) -> None:
    line = json.dumps({"ts": int(time.time()), **entry}, ensure_ascii=False)
    with ESCALATION_LOG.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def append_ai_consent(entry: dict) -> None:
    """Append-only preference log. Never truncates."""
    line = json.dumps({"ts": int(time.time()), **entry}, ensure_ascii=False)
    with AI_CONSENT_LOG.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def append_legal_consent(entry: dict) -> None:
    """Append-only legal age/terms consent (C-170). Never truncates."""
    line = json.dumps({"ts": int(time.time()), **entry}, ensure_ascii=False)
    with LEGAL_CONSENT_LOG.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def append_audit(entry: dict) -> None:
    """Append-only campus audit trail (C-171/C-172). Never truncates."""
    line = json.dumps({"ts": int(time.time()), **entry}, ensure_ascii=False)
    with AUDIT_LOG.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def client_ip_from_headers(headers, fallback: str = "") -> str:
    """Prefer X-Forwarded-For (first hop), else fallback (e.g. client_address)."""
    xff = (headers.get("X-Forwarded-For") or headers.get("x-forwarded-for") or "").strip()
    if xff:
        return xff.split(",")[0].strip()[:80]
    xri = (headers.get("X-Real-IP") or headers.get("x-real-ip") or "").strip()
    if xri:
        return xri[:80]
    return (fallback or "")[:80]


def has_valid_legal_consent(client_id: str) -> bool:
    """True if client_id has a recent legal consent (memory TTL or log scan)."""
    if not client_id or not SAFE_CLIENT.match(client_id):
        return False
    now = int(time.time())
    with _legal_consent_lock:
        row = _legal_consent_mem.get(client_id)
        if row and (now - int(row.get("ts") or 0)) <= LEGAL_CONSENT_TTL_SEC:
            return True
    if not LEGAL_CONSENT_LOG.is_file():
        return False
    try:
        lines = LEGAL_CONSENT_LOG.read_text(encoding="utf-8-sig").splitlines()
    except Exception:
        return False
    for line in reversed(lines[-500:]):
        line = line.strip()
        if not line:
            continue
        try:
            row = json.loads(line)
        except Exception:
            continue
        if str(row.get("client_id") or "") != client_id:
            continue
        if not row.get("is_adult") or not row.get("terms_accepted"):
            continue
        ts = int(row.get("ts") or 0)
        if (now - ts) <= LEGAL_CONSENT_TTL_SEC:
            with _legal_consent_lock:
                _legal_consent_mem[client_id] = {
                    "ts": ts,
                    "consent_id": row.get("consent_id"),
                    "session_id": row.get("session_id"),
                }
            return True
    return False


def remember_legal_consent(
    client_id: str, consent_id: str, session_id: str, ts: int | None = None
) -> None:
    with _legal_consent_lock:
        _legal_consent_mem[client_id] = {
            "ts": int(ts or time.time()),
            "consent_id": consent_id,
            "session_id": session_id,
        }


# --- C-187 bans (variant A: client_id + IP) ------------------------------------


def _normalize_ip(ip: str) -> str:
    return (ip or "").strip()[:80]


def remember_client_seen(client_id: str, ip: str, room: str = "") -> None:
    """Record last IP for client_id so Owner can ban from a report."""
    if not client_id or not SAFE_CLIENT.match(client_id):
        return
    nip = _normalize_ip(ip)
    if not nip or not SAFE_IP.match(nip):
        return
    ts = int(time.time())
    row = {"ts": ts, "client_id": client_id, "ip": nip, "room": (room or "")[:64]}
    with _client_seen_lock:
        _client_seen_mem[client_id] = row
    try:
        with CLIENT_SEEN_LOG.open("a", encoding="utf-8") as f:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    except Exception as e:  # noqa: BLE001
        print("remember_client_seen:", e)


def get_last_ip(client_id: str) -> str:
    if not client_id or not SAFE_CLIENT.match(client_id):
        return ""
    with _client_seen_lock:
        row = _client_seen_mem.get(client_id)
        if row and row.get("ip"):
            return str(row["ip"])
    if not CLIENT_SEEN_LOG.is_file():
        return ""
    try:
        lines = CLIENT_SEEN_LOG.read_text(encoding="utf-8-sig").splitlines()
    except Exception:
        return ""
    for line in reversed(lines[-2000:]):
        line = line.strip()
        if not line:
            continue
        try:
            row = json.loads(line)
        except Exception:
            continue
        if str(row.get("client_id") or "") != client_id:
            continue
        ip = _normalize_ip(str(row.get("ip") or ""))
        if ip:
            with _client_seen_lock:
                _client_seen_mem[client_id] = {
                    "ts": int(row.get("ts") or 0),
                    "client_id": client_id,
                    "ip": ip,
                    "room": str(row.get("room") or ""),
                }
            return ip
    return ""


def _ban_key(client_id: str, ip: str) -> str:
    return "c:%s|i:%s" % ((client_id or "").strip(), _normalize_ip(ip))


def _read_ban_events(limit: int = 5000) -> list[dict]:
    if not BANS_LOG.is_file():
        return []
    try:
        lines = BANS_LOG.read_text(encoding="utf-8-sig").splitlines()
    except Exception:
        return []
    out: list[dict] = []
    for line in lines[-limit:]:
        line = line.strip()
        if not line:
            continue
        try:
            row = json.loads(line)
        except Exception:
            continue
        if isinstance(row, dict):
            out.append(row)
    return out


def list_active_bans() -> list[dict]:
    """Rebuild active bans from append-only log (last ban wins; lift clears)."""
    now = int(time.time())
    active: dict[str, dict] = {}
    with _bans_lock:
        events = _read_ban_events()
    for row in events:
        action = str(row.get("action") or "ban")
        cid = str(row.get("client_id") or "").strip()
        ip = _normalize_ip(str(row.get("ip") or ""))
        key = _ban_key(cid, ip)
        if action == "lift":
            # Lift by ban_id or by key
            ban_id = str(row.get("ban_id") or row.get("id") or "")
            if ban_id:
                to_del = [k for k, v in active.items() if str(v.get("id")) == ban_id]
                for k in to_del:
                    del active[k]
            if key in active:
                del active[key]
            continue
        until = int(row.get("until") or 0)
        if until and until <= now:
            continue
        active[key] = row
    # Drop expired that were never lifted
    return [
        v
        for v in active.values()
        if not int(v.get("until") or 0) or int(v.get("until") or 0) > now
    ]


def find_active_ban(client_id: str = "", ip: str = "") -> dict | None:
    cid = (client_id or "").strip()
    nip = _normalize_ip(ip)
    for ban in list_active_bans():
        b_cid = str(ban.get("client_id") or "").strip()
        b_ip = _normalize_ip(str(ban.get("ip") or ""))
        if cid and b_cid and cid == b_cid:
            return ban
        if nip and b_ip and nip == b_ip:
            return ban
    return None


def is_banned(client_id: str = "", ip: str = "") -> bool:
    return find_active_ban(client_id, ip) is not None


def append_ban_event(entry: dict) -> dict:
    row = {
        "id": str(entry.get("id") or ("ban-" + uuid.uuid4().hex[:12])),
        "ts": int(entry.get("ts") or time.time()),
        **{k: v for k, v in entry.items() if k not in ("id", "ts")},
    }
    with _bans_lock:
        with BANS_LOG.open("a", encoding="utf-8") as f:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    append_audit({"kind": "ban_event", **row})
    return row


def create_ban(
    *,
    client_id: str = "",
    ip: str = "",
    until_days: int | None = None,
    reason: str = "",
    room: str = "",
    source_report_id: str = "",
    by: str = "owner",
) -> dict:
    cid = (client_id or "").strip()
    nip = _normalize_ip(ip)
    if cid and not SAFE_CLIENT.match(cid):
        raise ValueError("bad_client_id")
    if nip and not SAFE_IP.match(nip):
        raise ValueError("bad_ip")
    if not cid and not nip:
        raise ValueError("need_client_id_or_ip")
    days = BAN_DEFAULT_DAYS if until_days is None else int(until_days)
    until = 0 if days <= 0 else int(time.time()) + days * 86400
    return append_ban_event(
        {
            "action": "ban",
            "client_id": cid or None,
            "ip": nip or None,
            "until": until,
            "until_days": days,
            "reason": (reason or "owner_ban")[:500],
            "room": (room or "")[:64] or None,
            "source_report_id": (source_report_id or "")[:80] or None,
            "by": (by or "owner")[:40],
        }
    )


def lift_ban(
    *,
    ban_id: str = "",
    client_id: str = "",
    ip: str = "",
    by: str = "owner",
    reason: str = "",
) -> dict:
    bid = (ban_id or "").strip()
    cid = (client_id or "").strip()
    nip = _normalize_ip(ip)
    if not bid and not cid and not nip:
        raise ValueError("need_ban_id_or_target")
    return append_ban_event(
        {
            "action": "lift",
            "ban_id": bid or None,
            "client_id": cid or None,
            "ip": nip or None,
            "reason": (reason or "owner_lift")[:500],
            "by": (by or "owner")[:40],
        }
    )


# --- C-171 chat text moderation -------------------------------------------------
# Latin lookalikes → Cyrillic for matching (homoglyph fold).
_HOMOGLYPH_TRANS = str.maketrans(
    {
        "a": "а",
        "c": "с",
        "e": "е",
        "o": "о",
        "p": "р",
        "x": "х",
        "y": "у",
        "A": "а",
        "C": "с",
        "E": "е",
        "O": "о",
        "P": "р",
        "X": "х",
        "Y": "у",
    }
)
# Conservative extremism stop patterns (clear violence/terror calls — not debate).
_EXTREMISM_RES = [
    re.compile(p, re.IGNORECASE)
    for p in (
        r"призыв\w*\s+к\s+террор",
        r"террористическ\w*",
        r"соверш\w*\s+теракт",
        r"взорв(ать|ём|ем|и)\s+(школ|здани|люд|толп|метро|автобус)",
        r"джихад\w*",
        r"уби(ть|вайте|ём)\s+(всех|людей|граждан)",
        r"массовы\w*\s+расстрел",
        r"заложен[ао]\s+бомб",
        r"сдела(ть|ем|ём)\s+бомб",
        r"оружи[ея]\s+массовог",
    )
]
# Compact Russian profanity roots (mask with *); not exhaustive.
_PROFANITY_ROOTS = (
    "бляд",
    "блят",
    "хуй",
    "хуя",
    "хуе",
    "хуё",
    "пизд",
    "ебан",
    "ёбан",
    "ебл",
    "ёбл",
    "ебат",
    "ёбат",
    "мудак",
    "мудил",
    "гандон",
    "гондон",
    "сука",
    "сучк",
    "пидор",
    "пидар",
    "педик",
    "залуп",
    "дроч",
    "ебал",
    "ёбал",
    "охуе",
    "охуи",
    "fuck",
    "shit",
    "bitch",
    "cunt",
)
_REPEAT_CHAR_RE = re.compile(r"(.)\1{2,}", re.DOTALL)


def _normalize_for_moderation(raw: str) -> str:
    text = unicodedata.normalize("NFKC", raw or "")
    text = "".join(ch for ch in text if unicodedata.category(ch)[0] != "C" or ch in "\n\t")
    text = text.translate(_HOMOGLYPH_TRANS)
    text = text.lower()
    text = _REPEAT_CHAR_RE.sub(r"\1\1", text)
    return text


def _mask_profanity(display: str, check: str) -> tuple[str, bool]:
    """Mask known roots in display text; matching uses normalized check string."""
    censored = False
    out = display
    for root in _PROFANITY_ROOTS:
        if root not in check:
            continue
        censored = True
        # Mask contiguous runs in original that look like the root (case-insensitive).
        pattern = re.compile(re.escape(root), re.IGNORECASE)
        out = pattern.sub("*" * max(2, len(root)), out)
        # Also try latin/cyrillic mixed: replace overlapping spans in check-space via fuzzy.
        # Fallback: if root still only in check (homoglyph), replace whole word-ish chunks.
        if root in _normalize_for_moderation(out):
            # Character-wise: rebuild by masking matching windows in normalized form.
            norm = _normalize_for_moderation(out)
            chars = list(out)
            i = 0
            while True:
                j = norm.find(root, i)
                if j < 0:
                    break
                for k in range(j, min(j + len(root), len(chars))):
                    chars[k] = "*"
                i = j + 1
            out = "".join(chars)
    return out, censored


def validate_and_sanitize(raw_text: str) -> dict:
    """
    C-171: NFKC + homoglyph + collapse → extremism block / profanity mask.
    Returns {text, censored, blocked, code}.
    """
    original = (raw_text or "").strip()[:1000]
    check = _normalize_for_moderation(original)
    for rx in _EXTREMISM_RES:
        if rx.search(check) or rx.search(original):
            return {
                "text": "",
                "censored": False,
                "blocked": True,
                "code": "BLOCKED_EXTREMISM_DETECTED",
            }
    masked, censored = _mask_profanity(original, check)
    return {
        "text": masked,
        "censored": censored,
        "blocked": False,
        "code": "CENSORED" if censored else "OK",
    }


def get_restrictions(room_id: str, client_id: str) -> dict | None:
    """In-memory auto-restrict flags for (room, client_id), or None."""
    if not room_id or not client_id:
        return None
    with _auto_restrict_lock:
        row = _auto_restrict.get((room_id, client_id))
        if not row:
            return None
        return dict(row)


def set_auto_restrict(room_id: str, target_client_id: str, *, reason: str = "") -> dict:
    flags = {"mic": True, "board": True, "chat": True, "reason": reason[:80]}
    with _auto_restrict_lock:
        _auto_restrict[(room_id, target_client_id)] = flags
    return dict(flags)


def note_report_and_maybe_restrict(
    room_id: str,
    target_client_id: str,
    reporter_client_id: str,
    *,
    reason_code: str = "",
) -> bool:
    """
    Track distinct reporters per (room, target).
    Returns True if threshold reached and auto_restrict applied (this call).
    """
    if not target_client_id or not SAFE_CLIENT.match(target_client_id):
        return False
    key = (room_id, target_client_id)
    newly_restricted = False
    with _auto_restrict_lock:
        reporters = _report_reporters.setdefault(key, set())
        if reporter_client_id and SAFE_CLIENT.match(reporter_client_id):
            reporters.add(reporter_client_id)
        if len(reporters) >= REPORT_AUTO_RESTRICT_THRESHOLD and key not in _auto_restrict:
            _auto_restrict[key] = {
                "mic": True,
                "board": True,
                "chat": True,
                "reason": reason_code or "reports",
                "reporters": len(reporters),
            }
            newly_restricted = True
            flags = dict(_auto_restrict[key])
        else:
            flags = dict(_auto_restrict.get(key) or {})
    if newly_restricted:
        append_mod_log(
            {
                "event": "AUTO_RESTRICT",
                "room": room_id,
                "target_client_id": target_client_id,
                "reason_code": reason_code,
                "reporters": flags.get("reporters"),
                "restrictions": {"mic": True, "board": True, "chat": True},
            }
        )
    return newly_restricted


def save_evidence_blob(
    *,
    room_id: str,
    target_client_id: str,
    reporter_client_id: str,
    reason_code: str,
    canvas_jpeg_b64: str = "",
    board_png_b64: str = "",
    board_state_json: str = "",
    chat_snapshot: list | None = None,
    audio_ref: str = "",
) -> str | None:
    """
    Write small evidence JSON under evidence/{uuid}.json.
    Stores jpeg/png only if under size limit; board JSON truncated.
    Returns evidence id or None. NO continuous DRAW_STROKE logging.
    """
    eid = str(uuid.uuid4())
    jpeg = (canvas_jpeg_b64 or "").strip()
    png = (board_png_b64 or "").strip()
    jpeg_stored = ""
    png_stored = ""
    jpeg_truncated = False
    if jpeg:
        if len(jpeg) > EVIDENCE_JPEG_MAX_B64:
            jpeg_truncated = True
            jpeg = jpeg[:EVIDENCE_JPEG_MAX_B64]
        try:
            raw = base64.b64decode(jpeg[:64] + "==", validate=False)
            _ = raw
            jpeg_stored = jpeg
        except Exception:
            jpeg_stored = ""
            jpeg_truncated = True
    if png:
        if len(png) > EVIDENCE_JPEG_MAX_B64:
            png = png[:EVIDENCE_JPEG_MAX_B64]
        try:
            raw = base64.b64decode(png[:64] + "==", validate=False)
            _ = raw
            png_stored = png
        except Exception:
            png_stored = ""
    state = (board_state_json or "").strip()
    if len(state) > 400_000:
        state = state[:400_000]
    snap = chat_snapshot if isinstance(chat_snapshot, list) else []
    snap = snap[:10]
    slim_snap = []
    for m in snap:
        if isinstance(m, dict):
            slim_snap.append(
                {
                    "id": str(m.get("id") or "")[:16],
                    "name": str(m.get("name") or "")[:40],
                    "text": str(m.get("text") or "")[:200],
                    "ts": m.get("ts"),
                }
            )
        else:
            slim_snap.append({"text": str(m)[:200]})
    row = {
        "id": eid,
        "ts": int(time.time()),
        "room": room_id,
        "target_client_id": target_client_id,
        "reporter_client_id": reporter_client_id,
        "reason_code": reason_code,
        "canvas_jpeg_b64": jpeg_stored or png_stored,
        "board_png_b64": png_stored,
        "board_state_json": state,
        "canvas_jpeg_truncated": jpeg_truncated,
        "chat_snapshot": slim_snap,
        "audio_ref": (audio_ref or "")[:200],
    }
    path = EVIDENCE_DIR / ("%s.json" % eid)
    try:
        path.write_text(json.dumps(row, ensure_ascii=False), encoding="utf-8")
    except Exception:
        return None
    return eid


def remove_livekit_participant(room_id: str, identity: str) -> bool:
    """Force-remove a participant (same pattern as moderate kick)."""
    from livekit import api

    if not room_id or not identity or not SAFE_ROOM.match(room_id):
        return False

    async def _run() -> None:
        lk = api.LiveKitAPI(LIVEKIT_HTTP, API_KEY, API_SECRET)
        try:
            await lk.room.remove_participant(
                api.RoomParticipantIdentity(room=room_id, identity=identity)
            )
        finally:
            await lk.aclose()

    try:
        asyncio.run(_run())
        return True
    except Exception as e:  # noqa: BLE001
        print("remove_livekit_participant failed:", e)
        return False


def list_participants_meta(room_id: str) -> list[dict]:
    """[{identity, client_id, name}] from LiveKit; empty on error."""
    from livekit import api

    if not room_id or not SAFE_ROOM.match(room_id):
        return []

    async def _run() -> list[dict]:
        lk = api.LiveKitAPI(LIVEKIT_HTTP, API_KEY, API_SECRET)
        out: list[dict] = []
        try:
            res = await lk.room.list_participants(
                api.ListParticipantsRequest(room=room_id)
            )
            for p in res.participants or []:
                try:
                    meta = json.loads(p.metadata or "{}")
                except Exception:
                    meta = {}
                out.append(
                    {
                        "identity": p.identity or "",
                        "name": p.name or "",
                        "client_id": str(meta.get("client_id") or ""),
                    }
                )
        finally:
            await lk.aclose()
        return out

    try:
        return asyncio.run(_run())
    except Exception:
        return []


def enforce_single_session(room_id: str, client_id: str, new_identity: str) -> list[str]:
    """
    C-169: one LiveKit presence per (room, client_id).
    Remove prior identity from memory + LiveKit list_participants metadata match.
    Returns list of removed identities. Audits SESSION_OVERRIDE.
    """
    if not client_id or not SAFE_CLIENT.match(client_id):
        return []
    removed: list[str] = []
    key = (room_id, client_id)
    now = int(time.time())
    with _session_lock:
        prev = _active_sessions.get(key)
        if prev:
            old_id = str(prev.get("identity") or "")
            prev_ts = int(prev.get("ts") or 0)
            # C-196: skip remove if same identity or stamp is brand-new (<1.5s)
            # and we are racing a StrictMode double-token — still override older.
            if old_id and old_id != new_identity:
                if now - prev_ts >= 1:
                    removed.append(old_id)
                elif now - prev_ts < 1:
                    # Very fresh prior token (likely StrictMode) — still remove
                    # so only one presence remains, but mark for client grace.
                    removed.append(old_id)
        _active_sessions[key] = {"identity": new_identity, "ts": now}

    for old_id in list(removed):
        remove_livekit_participant(room_id, old_id)

    # Also scan LiveKit for other participants with same metadata client_id.
    for p in list_participants_meta(room_id):
        if p.get("client_id") != client_id:
            continue
        ident = p.get("identity") or ""
        if not ident or ident == new_identity:
            continue
        if ident not in removed:
            removed.append(ident)
        remove_livekit_participant(room_id, ident)

    if removed:
        append_mod_log(
            {
                "event": "SESSION_OVERRIDE",
                "room": room_id,
                "client_id": client_id,
                "new_identity": new_identity,
                "removed_identities": removed,
            }
        )
    return removed


def read_prompt_file(name: str) -> str:
    path = AI_PROMPTS_DIR / name
    if not path.is_file():
        return ""
    try:
        return path.read_text(encoding="utf-8")
    except Exception:
        return ""


def toxicity_hit(text: str) -> bool:
    low = (text or "").lower()
    return any(k in low for k in TOXICITY_KEYWORDS)


def emit_toxicity_ai_event(
    room_id: str,
    identity: str,
    text_snippet: str,
    *,
    source: str = "coach",
) -> dict:
    """Append toxicity_ai to moderation + escalation + owner inbox. No auto-kick."""
    snippet = (text_snippet or "")[:160]
    row = {
        "kind": "toxicity_ai",
        "room": room_id,
        "identity": identity,
        "source": source,
        "snippet": snippet,
        "auto_kick": False,
    }
    append_mod_log(row)
    append_escalation(row)
    append_inbox(
        {
            "kind": "toxicity_ai",
            "title": "AI toxicity stub: %s" % (identity or "unknown"),
            "body": "Помечен токсичный фрагмент (stub). Host решает mute/escalate. Без auto-kick.",
            "room": room_id,
            "meta": row,
        }
    )
    return row


def heuristic_coach(text: str, lang: str = "ru") -> dict:
    """Offline coach stub: fillers + soft notes. Always private response shape."""
    low = (text or "").lower()
    fillers: list[dict] = []
    for word, alts in FILLER_MAP.items():
        if word in low:
            clean_alts = [a for a in alts if a]
            fillers.append(
                {
                    "word": word,
                    "alternatives": clean_alts[:2] or ["(пауза вместо паразита)"],
                }
            )
    if lang.startswith("en"):
        notes = (
            "Heuristic stub (no LLM key): check fillers and shorten long clauses."
            if fillers
            else "Heuristic stub: clear enough — try one richer synonym next turn."
        )
        alternatives = [
            "Say the same idea in one shorter sentence.",
            "Replace fillers with a short pause.",
        ]
    else:
        notes = (
            "Заглушка без LLM: проверьте слова-паразиты и укоротите длинные фразы."
            if fillers
            else "Заглушка: реплика понятна — добавьте один более точный синоним."
        )
        alternatives = [
            "Скажите ту же мысль одним коротким предложением.",
            "Замените паразиты короткой паузой.",
        ]
    return {
        "ok": True,
        "degraded": True,
        "notes": notes,
        "fillers": fillers,
        "alternatives": alternatives,
        "toxicity": False,
    }


def run_stt_text_first(text: str) -> dict:
    """
    V1 STT: accept transcript text. Audio blob upload is L2.
    Without provider key → degraded passthrough (no 5xx).
    """
    cleaned = (text or "").strip()[:STT_TEXT_MAX]
    if not cleaned:
        return {
            "ok": False,
            "degraded": True,
            "error": "empty_text",
            "hint": "Пришлите текстовый снимок реплики",
        }
    if not OPENAI_API_KEY:
        return {
            "ok": True,
            "degraded": True,
            "transcript": cleaned,
            "provider": "passthrough",
            "hint": "STT provider не настроен — принят текст как есть",
        }
    # Key present: still text-first MVP (no Whisper call in this wave).
    return {
        "ok": True,
        "degraded": False,
        "transcript": cleaned,
        "provider": "text_first",
        "hint": "Аудио STT — L2; сейчас text-first",
    }


def run_private_coach(
    room_id: str,
    identity: str,
    text: str,
    lang: str = "ru",
    cefr: str = "any",
    *,
    consent: bool = False,
    check_toxicity: bool = True,
) -> dict:
    """Private coach + filler. Toxicity append on hit; never auto-kick."""
    if not consent:
        return {
            "ok": False,
            "degraded": True,
            "error": "consent_required",
            "hint": "Нужно согласие на AI-разбор своей речи",
        }
    cleaned = (text or "").strip()[:COACH_TEXT_MAX]
    if not cleaned:
        return {
            "ok": False,
            "degraded": True,
            "error": "empty_text",
            "hint": "Пустая реплика",
        }

    toxic = False
    if check_toxicity and toxicity_hit(cleaned):
        toxic = True
        emit_toxicity_ai_event(room_id, identity, cleaned, source="coach")

    # LLM call deferred: without key use heuristic; with key still heuristic
    # this wave (wire OpenAI later without changing response contract).
    _ = (OPENAI_API_KEY, cefr, read_prompt_file("coach_system.txt"))
    out = heuristic_coach(cleaned, lang=lang)
    if OPENAI_API_KEY:
        out["degraded"] = False
        out["notes"] = (
            "(Ключ есть, LLM wire L2) " + str(out.get("notes") or "")
        ).strip()
    out["toxicity"] = toxic
    out["identity"] = identity
    out["room"] = room_id
    return out


def moderate_participant(
    room_id: str,
    action: str,
    target_identity: str,
    requester_identity: str,
    *,
    target_client_id: str = "",
    reason: str = "",
) -> dict:
    from livekit import api

    if action not in ("mute", "kick", "escalate"):
        raise ValueError("bad_action")
    if not SAFE_ROOM.match(room_id):
        raise ValueError("bad_room_id")
    if not target_identity or not requester_identity:
        raise ValueError("missing_identity")
    if target_identity == requester_identity:
        raise ValueError("cannot_moderate_self")
    if participant_role(room_id, requester_identity) != "host":
        raise PermissionError("not_host")

    async def _run() -> dict:
        lk = api.LiveKitAPI(LIVEKIT_HTTP, API_KEY, API_SECRET)
        try:
            if action == "kick":
                await lk.room.remove_participant(
                    api.RoomParticipantIdentity(room=room_id, identity=target_identity)
                )
            else:
                # mute and escalate both revoke publish (manual toxicity stub)
                await lk.room.update_participant(
                    api.UpdateParticipantRequest(
                        room=room_id,
                        identity=target_identity,
                        permission=api.ParticipantPermission(
                            can_subscribe=True,
                            can_publish=False,
                            can_publish_data=True,
                        ),
                    )
                )
            out: dict = {"ok": True, "action": action, "target": target_identity}
            if action == "escalate":
                new_trust = None
                if target_client_id and SAFE_CLIENT.match(target_client_id):
                    new_trust = set_trust(
                        target_client_id,
                        get_trust(target_client_id) - TRUST_ESCALATE_PENALTY,
                    )
                append_escalation(
                    {
                        "room": room_id,
                        "target": target_identity,
                        "target_client_id": target_client_id,
                        "requester": requester_identity,
                        "reason": (reason or "host_escalate")[:200],
                        "new_trust": new_trust,
                    }
                )
                out["target_trust"] = new_trust
                out["message"] = "Escalate: mute + trust penalty"
            return out
        finally:
            await lk.aclose()

    return asyncio.run(_run())


def set_participant_role_meta(
    room_id: str, identity: str, role: str, client_id: str = ""
) -> bool:
    """Update LiveKit participant metadata role (host|member)."""
    from livekit import api

    if not SAFE_ROOM.match(room_id) or not identity:
        return False
    if role not in ("host", "member"):
        return False
    meta_obj: dict = {"role": role}
    if client_id:
        meta_obj["client_id"] = client_id

    async def _run() -> None:
        lk = api.LiveKitAPI(LIVEKIT_HTTP, API_KEY, API_SECRET)
        try:
            # Preserve existing client_id from LiveKit if not provided
            cid = client_id
            if not cid:
                res = await lk.room.list_participants(
                    api.ListParticipantsRequest(room=room_id)
                )
                for p in res.participants or []:
                    if (p.identity or "") != identity:
                        continue
                    try:
                        old = json.loads(p.metadata or "{}")
                        if old.get("client_id"):
                            cid = str(old["client_id"])
                    except Exception:
                        pass
                    break
            meta = dict(meta_obj)
            if cid:
                meta["client_id"] = cid
            await lk.room.update_participant(
                api.UpdateParticipantRequest(
                    room=room_id,
                    identity=identity,
                    metadata=json.dumps(meta, ensure_ascii=False),
                )
            )
        finally:
            await lk.aclose()

    try:
        asyncio.run(_run())
        return True
    except Exception as e:  # noqa: BLE001
        print("set_participant_role_meta:", e)
        return False


def list_participants_ordered(room_id: str) -> list[dict]:
    """Participants sorted by joined_at ascending (earliest first)."""
    from livekit import api

    if not SAFE_ROOM.match(room_id or ""):
        return []

    async def _run() -> list[dict]:
        lk = api.LiveKitAPI(LIVEKIT_HTTP, API_KEY, API_SECRET)
        out: list[dict] = []
        try:
            res = await lk.room.list_participants(
                api.ListParticipantsRequest(room=room_id)
            )
            for p in res.participants or []:
                try:
                    meta = json.loads(p.metadata or "{}")
                except Exception:
                    meta = {}
                joined = 0
                try:
                    joined = int(getattr(p, "joined_at", 0) or 0)
                except Exception:
                    joined = 0
                out.append(
                    {
                        "identity": p.identity or "",
                        "name": p.name or "",
                        "client_id": str(meta.get("client_id") or ""),
                        "role": str(meta.get("role") or "member"),
                        "joined_at": joined,
                    }
                )
        finally:
            await lk.aclose()
        out.sort(key=lambda r: (int(r.get("joined_at") or 0), r.get("identity") or ""))
        return out

    try:
        return asyncio.run(_run())
    except Exception:
        return []


def transfer_host(
    room_id: str,
    to_identity: str,
    *,
    from_identity: str = "",
    allow_orphan_promote: bool = False,
) -> dict:
    """
    C-243: give host role to to_identity; demote previous host(s).
    If from_identity set — must currently be host (manual transfer).
    If allow_orphan_promote — promote when no host left (auto on leave).
    """
    if not SAFE_ROOM.match(room_id) or not to_identity:
        raise ValueError("bad_args")
    peers = list_participants_ordered(room_id)
    if not peers:
        raise ValueError("empty_room")
    target = next((p for p in peers if p["identity"] == to_identity), None)
    if not target:
        raise ValueError("target_not_in_room")
    hosts = [p for p in peers if p.get("role") == "host"]
    if from_identity:
        requester = next((p for p in peers if p["identity"] == from_identity), None)
        if not requester or requester.get("role") != "host":
            raise PermissionError("not_host")
    elif not allow_orphan_promote and hosts:
        raise PermissionError("host_exists")
    # Demote all current hosts except target
    for h in hosts:
        if h["identity"] == to_identity:
            continue
        set_participant_role_meta(
            room_id, h["identity"], "member", h.get("client_id") or ""
        )
    ok = set_participant_role_meta(
        room_id, to_identity, "host", target.get("client_id") or ""
    )
    if not ok:
        raise RuntimeError("metadata_update_failed")
    append_audit(
        {
            "event": "HOST_TRANSFER",
            "room": room_id,
            "from": from_identity or "(auto)",
            "to": to_identity,
        }
    )
    return {"ok": True, "host_identity": to_identity}


def promote_next_host_if_needed(
    room_id: str,
    departed_identity: str = "",
) -> dict | None:
    """C-250: ensure exactly one host among remaining joiners.

    Cascade by join order: after host leaves, earliest remaining gets host
    (2nd joiner, then 3rd, then 4th … until last person in the room).
    """
    peers = list_participants_ordered(room_id)
    if not peers:
        return None
    # Ignore departed if still briefly listed (race)
    if departed_identity:
        peers = [p for p in peers if p.get("identity") != departed_identity]
        if not peers:
            return None
    hosts = [p for p in peers if p.get("role") == "host"]
    if len(hosts) == 1:
        return {
            "ok": True,
            "host_identity": hosts[0]["identity"],
            "unchanged": True,
        }
    if len(hosts) > 1:
        # Keep earliest-joined host; demote the rest
        hosts_sorted = sorted(
            hosts,
            key=lambda r: (int(r.get("joined_at") or 0), r.get("identity") or ""),
        )
        keep = hosts_sorted[0]
        for h in hosts_sorted[1:]:
            set_participant_role_meta(
                room_id, h["identity"], "member", h.get("client_id") or ""
            )
        return {
            "ok": True,
            "host_identity": keep["identity"],
            "deduped": True,
        }
    # Zero hosts → promote earliest remaining (cascade)
    nxt = peers[0]
    try:
        return transfer_host(
            room_id,
            nxt["identity"],
            allow_orphan_promote=True,
        )
    except Exception as e:  # noqa: BLE001
        print("promote_next_host_if_needed:", e)
        return None


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:  # noqa: A003
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))

    def _cors(self) -> None:
        origin = self.headers.get("Origin") or "*"
        # Local admin + campus + prod
        allowed = {
            "https://vernatunspeakclub.com",
            "http://127.0.0.1:5173",
            "http://localhost:5173",
            "http://127.0.0.1:5174",
            "http://localhost:5174",
            "null",
        }
        if origin in allowed or origin.startswith("http://127.0.0.1:") or origin.startswith("http://localhost:"):
            self.send_header("Access-Control-Allow-Origin", origin)
        else:
            self.send_header("Access-Control-Allow-Origin", "https://vernatunspeakclub.com")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header(
            "Access-Control-Allow-Headers",
            "Content-Type, X-Owner-Password",
        )

    def _json(self, code: int, obj: dict | list) -> None:
        raw = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else b"{}"
        try:
            return json.loads(body.decode("utf-8"))
        except Exception:
            return {}

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        qs = parse_qs(parsed.query)

        if path == "/api/lounge/calendar":
            try:
                self._json(200, calendar_feed.get((qs.get("month") or [""])[0]))
            except CalendarFeedError as error:
                code = str(error)
                self._json(400 if code == "invalid_month" else 503, {"ok": False, "error": code})
            return

        if path == "/":
            self._json(200, {"ok": True, "service": "vernatun-lounge"})
            return

        if path in ("/rooms", "/api/lounge/rooms"):
            catalog = load_rooms()
            online_map = livekit_online_map([str(r["id"]) for r in catalog])
            rooms = []
            for r in catalog:
                rid = r["id"]
                view = public_room_view(r)
                online_n = int(online_map.get(rid, 0))
                sess = get_session_status(rid)
                # C-255: empty LiveKit room must not keep a running session / ghost online
                if online_n == 0 and sess.get("active"):
                    maybe_clear_chat(rid, force=True)
                    sess = get_session_status(rid)
                    online_n = 0
                # Occupied room without session file → start/resume duration clock
                if online_n > 0 and not sess.get("active"):
                    sess = ensure_session_started(rid)
                active = bool(sess.get("active"))
                remaining = (
                    int(sess.get("remainingSec") or 0)
                    if active
                    else SESSION_DURATION_SEC
                )
                rooms.append(
                    {
                        **view,
                        "online": online_n,
                        "session_active": active,
                        "remaining_sec": remaining,
                        "duration_sec": SESSION_DURATION_SEC,
                        "ends_at": int(sess.get("endsAt") or 0) if active else 0,
                    }
                )
            self._json(200, {"rooms": rooms})
            return

        if path in ("/chat", "/api/lounge/chat"):
            room_id = (qs.get("room") or [""])[0]
            if not room_by_id(room_id):
                self._json(404, {"error": "room_not_found"})
                return
            try:
                self._json(200, {"room": room_id, "messages": read_chat(room_id)})
            except ValueError as e:
                self._json(400, {"error": str(e)})
            return

        if path in ("/session", "/api/lounge/session"):
            room_id = (qs.get("room") or [""])[0]
            if not room_id or not SAFE_ROOM.match(room_id):
                self._json(400, {"error": "bad_room"})
                return
            if not room_by_id(room_id):
                self._json(404, {"error": "room_not_found"})
                return
            status = get_session_status(room_id)
            invalidate_online_cache(room_id)
            online_n = livekit_online(room_id)
            # C-255: only wipe when LiveKit confirmed empty (never on API error)
            if online_n == 0 and status.get("active"):
                maybe_clear_chat(room_id, force=True)
                status = get_session_status(room_id)
            if online_n is not None and online_n > 0 and not status.get("active"):
                status = ensure_session_started(room_id)
            payload = dict(status)
            if online_n is not None:
                payload["online"] = online_n
            self._json(200, payload)
            return

        if path in ("/board", "/api/lounge/board"):
            room_id = (qs.get("room") or [""])[0]
            nick = (qs.get("nickname") or [""])[0]
            if not room_by_id(room_id):
                self._json(404, {"error": "room_not_found"})
                return
            try:
                from spacedeck_client import ensure_board

                board = ensure_board(room_id, nickname=nick)
                self._json(
                    200,
                    {
                        "ok": True,
                        "room": room_id,
                        "url": board["url"],
                        "space_id": board.get("space_id"),
                        "provisioned": board.get("provisioned"),
                        "storage_hint": (
                            "PDF и файлы удаляются сразу, когда в комнате не осталось "
                            "участников (конец сеанса)."
                        ),
                    },
                )
            except Exception as e:  # noqa: BLE001
                base = os.environ.get(
                    "SPACEDECK_PUBLIC_URL", "http://127.0.0.1:9666"
                ).rstrip("/")
                self._json(
                    200,
                    {
                        "ok": False,
                        "degraded": True,
                        "room": room_id,
                        "url": base,
                        "error": str(e)[:200],
                        "hint": (
                            "Не удалось выдать Instant Edit Link. "
                            "Проверьте Spacedeck :9666 и SPACEDECK_* в .env"
                        ),
                        "storage_hint": (
                            "PDF удаляются при пустой комнате, когда доска provisioned."
                        ),
                    },
                )
            return

        if path in ("/token", "/api/lounge/token"):
            room_id = (qs.get("room") or ["vernatun-smoke"])[0]
            client_id = (qs.get("client_id") or [""])[0].strip()
            password = (qs.get("password") or [""])[0]
            if client_id and not SAFE_CLIENT.match(client_id):
                self._json(400, {"error": "bad_client_id"})
                return
            req_ip = client_ip_from_headers(
                self.headers,
                fallback=str(self.client_address[0] if self.client_address else ""),
            )
            # C-187: ban gate (client_id and/or IP) before legal / room checks
            ban = find_active_ban(client_id, req_ip)
            if ban:
                self._json(
                    403,
                    {
                        "error": "banned",
                        "hint": "Доступ к комнатам Кампуса ограничен модерацией",
                        "until": ban.get("until") or 0,
                        "ban_id": ban.get("id"),
                    },
                )
                return
            # C-170: legal consent required when client_id is present
            if client_id and not has_valid_legal_consent(client_id):
                self._json(
                    403,
                    {
                        "error": "legal_consent_required",
                        "hint": "Подтвердите 18+ и согласие с правилами перед входом",
                    },
                )
                return
            if client_id:
                remember_client_seen(client_id, req_ip, room=room_id)
            meta = room_by_id(room_id)
            if not meta:
                self._json(404, {"error": "room_not_found", "room": room_id})
                return
            if meta.get("password_hash") and not check_room_password(
                str(meta.get("password_hash") or ""), password
            ):
                self._json(403, {"error": "bad_password", "hint": "Нужен пароль комнаты"})
                return
            trust = get_trust(client_id) if client_id else TRUST_DEFAULT
            if room_requires_trust(meta) and trust < TRUST_GATE_MIN:
                self._json(
                    403,
                    {
                        "error": "trust_too_low",
                        "trust": trust,
                        "min": TRUST_GATE_MIN,
                        "hint": "Academic Trust Score слишком низкий для этой комнаты",
                    },
                )
                return
            n = next_noname(room_id)
            # C-233: preferred nick from client (NameGate); fallback NonameN
            wanted = sanitize_display_name((qs.get("display_name") or [""])[0])
            display_name = wanted or ("Noname%d" % n)
            identity = "noname-%s-%d-%d" % (room_id, n, int(time.time()) % 100000)
            online_n = livekit_online(room_id)
            is_host = online_n == 0  # None (API down) → not host
            session = ensure_session_started(room_id)
            try:
                token = make_token(
                    identity, display_name, room_id, is_host=is_host, client_id=client_id
                )
            except Exception as e:  # noqa: BLE001
                self._json(500, {"error": str(e)})
                return
            # C-169: single-session mutex — kick prior identity for same client_id
            overridden: list[str] = []
            if client_id:
                try:
                    overridden = enforce_single_session(room_id, client_id, identity)
                except Exception as e:  # noqa: BLE001
                    print("enforce_single_session:", e)
            restrictions = get_restrictions(room_id, client_id) if client_id else None
            self._json(
                200,
                {
                    "token": token,
                    "url": LIVEKIT_URL,
                    "room": room_id,
                    "room_title": meta.get("title"),
                    "display_name": display_name,
                    "identity": identity,
                    "is_host": is_host,
                    "trust": trust,
                    "share_path": "/room?room=%s" % room_id,
                    "issued_at": int(time.time()),
                    "session": session,
                    "session_override": bool(overridden),
                    "removed_identities": overridden,
                    "restrictions": restrictions,
                },
            )
            return

        if path in ("/restrictions", "/api/lounge/restrictions"):
            room_id = (qs.get("room") or [""])[0].strip()
            client_id = (qs.get("client_id") or [""])[0].strip()
            if not room_id or not SAFE_ROOM.match(room_id):
                self._json(400, {"error": "bad_room"})
                return
            if not client_id or not SAFE_CLIENT.match(client_id):
                self._json(400, {"error": "bad_client_id"})
                return
            flags = get_restrictions(room_id, client_id)
            self._json(
                200,
                {
                    "ok": True,
                    "room": room_id,
                    "client_id": client_id,
                    "restricted": bool(flags),
                    "restrictions": flags,
                },
            )
            return

        if path in ("/trust", "/api/lounge/trust"):
            client_id = (qs.get("client_id") or [""])[0].strip()
            if not client_id or not SAFE_CLIENT.match(client_id):
                self._json(400, {"error": "bad_client_id"})
                return
            self._json(200, {"client_id": client_id, "trust": get_trust(client_id)})
            return

        if path in ("/admin/inbox", "/api/lounge/admin/inbox"):
            pwd = self.headers.get("X-Owner-Password") or ""
            if not owner_password_ok(pwd):
                self._json(401, {"error": "unauthorized"})
                return
            limit = 100
            try:
                limit = min(200, max(1, int((qs.get("limit") or ["100"])[0])))
            except Exception:
                limit = 100
            self._json(200, {"items": read_inbox(limit)})
            return

        if path in ("/admin/moderation", "/api/lounge/admin/moderation"):
            pwd = self.headers.get("X-Owner-Password") or ""
            if not owner_password_ok(pwd):
                self._json(401, {"error": "unauthorized"})
                return
            limit = 100
            try:
                limit = min(200, max(1, int((qs.get("limit") or ["100"])[0])))
            except Exception:
                limit = 100
            # C-217: merge sentinel incidents into Moderation feed (newest first).
            mods = read_mod_log(limit)
            incs = [incident_as_mod_item(r) for r in read_incidents(limit)]
            merged = sorted(
                mods + incs,
                key=lambda r: int(r.get("ts") or 0),
                reverse=True,
            )[:limit]
            self._json(200, {"items": merged})
            return

        if path in ("/admin/incidents", "/api/lounge/admin/incidents"):
            pwd = self.headers.get("X-Owner-Password") or ""
            if not owner_password_ok(pwd):
                self._json(401, {"error": "unauthorized"})
                return
            limit = 100
            try:
                limit = min(200, max(1, int((qs.get("limit") or ["100"])[0])))
            except Exception:
                limit = 100
            items = [incident_as_mod_item(r) for r in read_incidents(limit)]
            self._json(200, {"items": items})
            return

        if path in ("/admin/bans", "/api/lounge/admin/bans"):
            pwd = self.headers.get("X-Owner-Password") or ""
            if not owner_password_ok(pwd):
                self._json(401, {"error": "unauthorized"})
                return
            self._json(200, {"items": list_active_bans()})
            return

        # C-229: public read of sentinel sample patterns (for room clients)
        if path in (
            "/sentinel-patterns",
            "/api/lounge/sentinel-patterns",
        ):
            self._json(200, {"ok": True, "patterns": load_sentinel_patterns()})
            return

        # C-229: owner read/write sentinel samples
        if path in (
            "/admin/sentinel-patterns",
            "/api/lounge/admin/sentinel-patterns",
        ):
            pwd = self.headers.get("X-Owner-Password") or ""
            if not owner_password_ok(pwd):
                self._json(401, {"error": "unauthorized"})
                return
            self._json(200, {"ok": True, "patterns": load_sentinel_patterns()})
            return

        # C-199: evidence preview for owner cabinet
        if path.startswith("/admin/evidence/") or path.startswith(
            "/api/lounge/admin/evidence/"
        ):
            pwd = self.headers.get("X-Owner-Password") or ""
            if not owner_password_ok(pwd):
                self._json(401, {"error": "unauthorized"})
                return
            eid = path.rsplit("/", 1)[-1].strip()
            row = load_evidence(eid)
            if not row:
                self._json(404, {"error": "evidence_not_found"})
                return
            self._json(200, {"item": row})
            return

        self._json(404, {"error": "not_found"})

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"

        # C-255: explicit leave from Campus SPA before/after LiveKit disconnect
        if path in ("/session/vacate", "/api/lounge/session/vacate"):
            data = self._read_json()
            room_id = str(data.get("room") or data.get("room_id") or "").strip()
            identity = str(data.get("identity") or "").strip()
            force_empty = bool(
                data.get("force_empty")
                or data.get("last")
                or data.get("alone")
            )
            if not room_id or not SAFE_ROOM.match(room_id):
                self._json(400, {"error": "bad_room"})
                return
            if not room_by_id(room_id):
                self._json(404, {"error": "room_not_found"})
                return
            self._json(
                200,
                vacate_room_session(room_id, identity, force_empty=force_empty),
            )
            return

        if path in ("/report", "/api/lounge/report"):
            data = self._read_json()
            room_id = str(data.get("room") or "")
            reporter_id = str(data.get("reporter_identity") or "")
            reporter_client = str(data.get("reporter_client_id") or "").strip()
            target_id = str(data.get("target_identity") or "").strip()
            target_client = str(data.get("target_client_id") or "").strip()
            reason = str(data.get("reason") or "user_report")[:200]
            reason_code = str(data.get("reason_code") or "").strip().upper()
            body = str(data.get("body") or data.get("text") or "").strip()[:2000]
            if reason_code and reason_code not in REASON_CODES:
                self._json(
                    400,
                    {
                        "error": "bad_reason_code",
                        "allowed": sorted(REASON_CODES),
                    },
                )
                return
            if not room_by_id(room_id):
                self._json(404, {"error": "room_not_found"})
                return
            if not reporter_id:
                self._json(400, {"error": "missing_identity"})
                return
            if len(body) < 10 and not reason_code:
                self._json(400, {"error": "body_too_short", "hint": "Опишите проблему (≥10 символов)"})
                return
            if reason_code and len(body) < 3:
                # reason_code alone is enough; still require a short note
                body = reason_code
            if target_id and reporter_id == target_id:
                self._json(400, {"error": "cannot_report_self"})
                return
            canvas_b64 = str(data.get("canvas_jpeg_b64") or "")
            # C-199: optional user-attached screenshot (prefer as primary if board empty)
            extra_b64 = str(data.get("extra_jpeg_b64") or data.get("screenshot_jpeg_b64") or "")
            if not canvas_b64 and extra_b64:
                canvas_b64 = extra_b64
            board_png = str(data.get("board_png_b64") or "")
            board_state = str(data.get("board_state_json") or "")
            chat_snap = data.get("chat_snapshot")
            audio_ref = str(data.get("audio_ref") or data.get("audio_note") or "")[:200]
            evidence_id = None
            if canvas_b64 or chat_snap or audio_ref or extra_b64 or board_png or board_state:
                evidence_id = save_evidence_blob(
                    room_id=room_id,
                    target_client_id=target_client,
                    reporter_client_id=reporter_client,
                    reason_code=reason_code or reason,
                    canvas_jpeg_b64=canvas_b64 or extra_b64,
                    board_png_b64=board_png,
                    board_state_json=board_state,
                    chat_snapshot=chat_snap if isinstance(chat_snap, list) else None,
                    audio_ref=audio_ref,
                )
            new_score = None
            if target_client and SAFE_CLIENT.match(target_client):
                new_score = set_trust(
                    target_client, get_trust(target_client) - TRUST_PENALTY
                )
            auto_restricted = False
            if target_client and SAFE_CLIENT.match(target_client):
                auto_restricted = note_report_and_maybe_restrict(
                    room_id,
                    target_client,
                    reporter_client,
                    reason_code=reason_code or reason,
                )
            title = (
                "Жалоба на %s" % target_id
                if target_id
                else "Проблема комнаты %s" % room_id
            )
            target_last_ip = get_last_ip(target_client) if target_client else ""
            reporter_ip = client_ip_from_headers(
                self.headers,
                fallback=str(self.client_address[0] if self.client_address else ""),
            )
            report_row = {
                "room": room_id,
                "reporter_identity": reporter_id,
                "reporter_client_id": reporter_client,
                "reporter_ip": reporter_ip or None,
                "target_identity": target_id,
                "target_client_id": target_client,
                "target_last_ip": target_last_ip or None,
                "reason": reason,
                "reason_code": reason_code or None,
                "body": body,
                "new_trust": new_score,
                "evidence_id": evidence_id,
                "auto_restricted": auto_restricted,
            }
            append_report(report_row)
            append_inbox(
                {
                    "kind": "report",
                    "title": title,
                    **report_row,
                }
            )
            restrictions = (
                get_restrictions(room_id, target_client) if target_client else None
            )
            self._json(
                200,
                {
                    "ok": True,
                    "target_trust": new_score,
                    "message": "Жалоба принята",
                    "evidence_id": evidence_id,
                    "auto_restricted": auto_restricted,
                    "restrictions": restrictions,
                    "reason_code": reason_code or None,
                },
            )
            return

        # C-217: Campus Sentinels — evidence-first incidents.
        # HARD RULE: never ban / mute / change trust from this endpoint.
        if path in ("/incidents", "/api/lounge/incidents"):
            data = self._read_json()
            room_id = str(
                data.get("room_id") or data.get("room") or ""
            ).strip()
            role = normalize_sentinel_role(
                str(data.get("sentinel_role") or ""),
                str(data.get("sentinel_id") or ""),
            )
            if not room_id or not SAFE_ROOM.match(room_id):
                self._json(400, {"error": "bad_room"})
                return
            if not room_by_id(room_id):
                self._json(404, {"error": "room_not_found"})
                return
            if not role:
                self._json(
                    400,
                    {
                        "error": "bad_sentinel_role",
                        "allowed": sorted(SENTINEL_ROLES),
                        "sentinel_ids": sorted(SENTINEL_ROLE_TO_ID.values()),
                    },
                )
                return
            action_taken = str(data.get("action_taken") or "FLAGGED").strip().upper()
            if action_taken not in SENTINEL_ACTIONS:
                self._json(
                    400,
                    {
                        "error": "bad_action_taken",
                        "allowed": sorted(SENTINEL_ACTIONS),
                        "hint": "BAN is not allowed from incidents API",
                    },
                )
                return
            # Reject any ban/mute/trust side-effect fields silently (store only flags)
            author_client = str(
                data.get("author_client_id") or data.get("client_id") or ""
            ).strip()
            if author_client and not SAFE_CLIENT.match(author_client):
                self._json(400, {"error": "bad_client_id"})
                return
            author_nick = str(
                data.get("author_nickname")
                or data.get("identity")
                or data.get("name")
                or ""
            ).strip()[:80]
            category = str(data.get("category") or data.get("surface") or "")[:80]
            reason = str(
                data.get("reason") or data.get("snippet") or ""
            ).strip()[:2000]
            chat_snippet = str(
                data.get("chat_snippet") or data.get("snippet") or ""
            ).strip()[:2000]
            shape_ids_raw = data.get("shape_ids")
            if shape_ids_raw is None and data.get("target_id"):
                shape_ids_raw = [data.get("target_id")]
            shape_ids: list[str] = []
            if isinstance(shape_ids_raw, list):
                shape_ids = [str(x)[:64] for x in shape_ids_raw[:40] if x]
            author_ip = str(data.get("author_ip") or data.get("ip") or "").strip()
            if not author_ip:
                author_ip = client_ip_from_headers(
                    self.headers,
                    fallback=str(
                        self.client_address[0] if self.client_address else ""
                    ),
                )
            author_ip = _normalize_ip(author_ip) or ""

            evidence_b64 = ""
            ev = data.get("evidence")
            if isinstance(ev, dict):
                kind = str(ev.get("kind") or "").lower()
                payload = str(ev.get("payload") or "")
                if kind in ("png_b64", "jpeg_b64", "image") and payload:
                    evidence_b64 = payload
            if not evidence_b64:
                evidence_b64 = str(
                    data.get("evidence_png_base64")
                    or data.get("evidence_png_b64")
                    or data.get("board_png_b64")
                    or ""
                ).strip()

            evidence_id = None
            if evidence_b64 or chat_snippet:
                evidence_id = save_evidence_blob(
                    room_id=room_id,
                    target_client_id=author_client,
                    reporter_client_id="sentinel:" + role.lower(),
                    reason_code="SENTINEL_%s" % role,
                    board_png_b64=evidence_b64,
                    chat_snapshot=(
                        [{"name": author_nick, "text": chat_snippet}]
                        if chat_snippet
                        else None
                    ),
                )

            matched = data.get("matched") if isinstance(data.get("matched"), dict) else {}
            row = append_incident(
                {
                    "room_id": room_id,
                    "room": room_id,
                    "sentinel_role": role,
                    "sentinel_id": SENTINEL_ROLE_TO_ID.get(role, role.lower()),
                    "sentinel_badge": incident_badge(role),
                    "category": category or None,
                    "reason": reason or chat_snippet or ("sentinel_%s" % role.lower()),
                    "author_client_id": author_client or None,
                    "author_nickname": author_nick or None,
                    "author_ip": author_ip or None,
                    "shape_ids": shape_ids,
                    "target_id": str(data.get("target_id") or "")[:64] or None,
                    "chat_snippet": chat_snippet or None,
                    "evidence_id": evidence_id,
                    "action_taken": action_taken,
                    "matched": {
                        str(k)[:64]: matched[k]
                        for k in list(matched.keys())[:12]
                    }
                    if matched
                    else None,
                    "source": str(data.get("source") or "client")[:40],
                    # Explicit: no sanctions from this write path
                    "auto_ban": False,
                    "auto_mute": False,
                    "trust_delta": 0,
                }
            )
            self._json(
                200,
                {
                    "ok": True,
                    "incident_id": row["incident_id"],
                    "evidence_id": evidence_id,
                    "sentinel_role": role,
                    "action_taken": action_taken,
                },
            )
            return

        if path in ("/rooms", "/api/lounge/rooms"):
            self._json(
                403,
                {
                    "error": "create_disabled",
                    "hint": "Создание комнат отключено. Выберите комнату из каталога Кампуса.",
                },
            )
            return

        # C-200: delete / purge inbox & moderation logs
        if path in (
            "/admin/inbox/delete",
            "/api/lounge/admin/inbox/delete",
        ):
            pwd = self.headers.get("X-Owner-Password") or ""
            if not owner_password_ok(pwd):
                self._json(401, {"error": "unauthorized"})
                return
            data = self._read_json()
            ids = data.get("ids") if isinstance(data.get("ids"), list) else []
            if data.get("id"):
                ids = list(ids) + [data.get("id")]
            result = delete_inbox_by_ids([str(x) for x in ids])
            self._json(200, {"ok": True, **result})
            return

        if path in (
            "/admin/inbox/purge",
            "/api/lounge/admin/inbox/purge",
        ):
            pwd = self.headers.get("X-Owner-Password") or ""
            if not owner_password_ok(pwd):
                self._json(401, {"error": "unauthorized"})
                return
            data = self._read_json()
            days = data.get("older_than_days")
            try:
                days_i = int(days) if days is not None and str(days) != "" else None
            except Exception:
                days_i = None
            kind = str(data.get("kind") or "").strip() or None
            if data.get("all") is True:
                days_i = None
                # keep kind filter if provided (e.g. purge all reports only)
            result = purge_inbox(older_than_days=days_i, kind=kind)
            self._json(200, {"ok": True, **result})
            return

        # C-208: optional QA mocks for owner cabinet visual review
        if path in (
            "/admin/inbox/seed-mocks",
            "/api/lounge/admin/inbox/seed-mocks",
        ):
            pwd = self.headers.get("X-Owner-Password") or ""
            if not owner_password_ok(pwd):
                self._json(401, {"error": "unauthorized"})
                return
            now = int(time.time())
            seeded = []
            samples = [
                ("Анна К.", "Гость_42", "lounge-alpha", "На доске написали оскорбление — приложила скрин."),
                ("Игорь М.", "Участник_7", "seminar-b", "Участник мешает занятию и спамит в чат."),
                ("Мария С.", "Demo_User", "campus-hall", "Просьба проверить поведение в комнате (мок для QA)."),
            ]
            for i, (reporter, target, room, body) in enumerate(samples):
                row = append_inbox(
                    {
                        "id": f"mock-report-{now}-{i}-{uuid.uuid4().hex[:8]}",
                        "kind": "report",
                        "ts": now - i * 3600,
                        "room": room,
                        "reporter_identity": reporter,
                        "target_identity": target,
                        "target_last_ip": f"203.0.113.{10 + i}",
                        "reporter_ip": f"198.51.100.{20 + i}",
                        "target_client_id": f"mock-client-{i}",
                        "title": f"Мок-жалоба {i + 1}",
                        "body": body,
                        "reason_code": "mock_qa",
                        "evidence_id": f"mock-evidence-{now}-{i}",
                        "_mock": True,
                    }
                )
                seeded.append(row)
            self._json(200, {"ok": True, "items": seeded, "count": len(seeded)})
            return

        if path in (
            "/admin/moderation/delete",
            "/api/lounge/admin/moderation/delete",
        ):
            pwd = self.headers.get("X-Owner-Password") or ""
            if not owner_password_ok(pwd):
                self._json(401, {"error": "unauthorized"})
                return
            data = self._read_json()
            ids = data.get("ids") if isinstance(data.get("ids"), list) else []
            if data.get("id"):
                ids = list(ids) + [data.get("id")]
            # C-217: incident rows (inc_…) live in incidents.jsonl
            inc_ids = [
                str(x)
                for x in ids
                if str(x).startswith("inc_") or str(x).startswith("inc-")
            ]
            # Also accept inbox ids for robot rows stored in inbox
            inbox_ids = [
                str(x)
                for x in ids
                if not str(x).startswith("mod-")
                and not str(x).startswith("host-")
                and not str(x).startswith("inc_")
                and not str(x).startswith("inc-")
            ]
            mod_uids = [str(x) for x in ids if str(x).startswith("mod-") or str(x).startswith("host-")]
            # host- uids from admin UI map to mod- via rebuild — also try stripping host-
            for u in list(mod_uids):
                if u.startswith("host-"):
                    # Prefer matching by reconstructing; store as-is for delete_mod
                    pass
            r_mod = delete_mod_by_uids(mod_uids) if mod_uids else {"removed": 0, "kept": 0}
            # Robot events live in inbox
            r_inbox = delete_inbox_by_ids(inbox_ids) if inbox_ids else {"removed": 0, "kept": 0}
            r_inc = delete_incidents_by_ids(inc_ids) if inc_ids else {"removed": 0, "kept": 0}
            # Also delete inbox ids that look like robot-*
            robot_ids = [str(x) for x in ids if str(x).startswith("robot-")]
            # robot- prefix is synthetic — need real inbox id from item
            self._json(
                200,
                {
                    "ok": True,
                    "moderation": r_mod,
                    "inbox": r_inbox,
                    "incidents": r_inc,
                    "hint": "For robot rows pass real inbox id (item.id)",
                },
            )
            return

        if path in (
            "/admin/incidents/delete",
            "/api/lounge/admin/incidents/delete",
        ):
            pwd = self.headers.get("X-Owner-Password") or ""
            if not owner_password_ok(pwd):
                self._json(401, {"error": "unauthorized"})
                return
            data = self._read_json()
            ids = data.get("ids") if isinstance(data.get("ids"), list) else []
            if data.get("id"):
                ids = list(ids) + [data.get("id")]
            result = delete_incidents_by_ids([str(x) for x in ids])
            self._json(200, {"ok": True, **result})
            return

        if path in (
            "/admin/moderation/purge",
            "/api/lounge/admin/moderation/purge",
        ):
            pwd = self.headers.get("X-Owner-Password") or ""
            if not owner_password_ok(pwd):
                self._json(401, {"error": "unauthorized"})
                return
            data = self._read_json()
            days = data.get("older_than_days")
            try:
                days_i = int(days) if days is not None and str(days) != "" else None
            except Exception:
                days_i = None
            if data.get("all") is True:
                days_i = None
            result = purge_mod_log(older_than_days=days_i)
            # Also purge non-report inbox (robots/alerts) with same age rule
            kind = str(data.get("kind") or "").strip() or None
            inbox_result = {"removed": 0, "kept": 0}
            if data.get("include_inbox_robots"):
                if kind:
                    inbox_result = purge_inbox(older_than_days=days_i, kind=kind)
                else:
                    # purge alert + toxicity separately if all
                    a = purge_inbox(older_than_days=days_i, kind="alert")
                    t = purge_inbox(older_than_days=days_i, kind="toxicity_ai")
                    inbox_result = {
                        "removed": a["removed"] + t["removed"],
                        "kept": min(a["kept"], t["kept"]),
                    }
            self._json(200, {"ok": True, "moderation": result, "inbox": inbox_result})
            return

        if path in ("/admin/alert", "/api/lounge/admin/alert"):
            pwd = self.headers.get("X-Owner-Password") or ""
            if not owner_password_ok(pwd):
                self._json(401, {"error": "unauthorized"})
                return
            data = self._read_json()
            row = append_inbox(
                {
                    "kind": "alert",
                    "title": str(data.get("title") or "Alert")[:120],
                    "body": str(data.get("body") or "")[:2000],
                    "room": str(data.get("room") or ""),
                    "meta": data.get("meta") if isinstance(data.get("meta"), dict) else {},
                }
            )
            self._json(200, {"ok": True, "item": row})
            return

        # C-229: save owner-edited sentinel keyword/regex samples
        if path in (
            "/admin/sentinel-patterns",
            "/api/lounge/admin/sentinel-patterns",
        ):
            pwd = self.headers.get("X-Owner-Password") or ""
            if not owner_password_ok(pwd):
                self._json(401, {"error": "unauthorized"})
                return
            data = self._read_json()
            raw = data.get("patterns") if isinstance(data.get("patterns"), dict) else data
            if not isinstance(raw, dict):
                self._json(400, {"error": "bad_patterns"})
                return
            saved = save_sentinel_patterns(raw)
            self._json(200, {"ok": True, "patterns": saved})
            return

        if path in ("/admin/bans", "/api/lounge/admin/bans"):
            pwd = self.headers.get("X-Owner-Password") or ""
            if not owner_password_ok(pwd):
                self._json(401, {"error": "unauthorized"})
                return
            data = self._read_json()
            cid = str(data.get("client_id") or "").strip()
            ip = str(data.get("ip") or data.get("target_last_ip") or "").strip()
            # If only client_id — fill last known IP for stronger ban
            if cid and not ip:
                ip = get_last_ip(cid)
            try:
                until_days = data.get("until_days")
                if until_days is None:
                    until_days = None
                else:
                    until_days = int(until_days)
                row = create_ban(
                    client_id=cid,
                    ip=ip,
                    until_days=until_days,
                    reason=str(data.get("reason") or "")[:500],
                    room=str(data.get("room") or "")[:64],
                    source_report_id=str(
                        data.get("source_report_id") or data.get("report_id") or ""
                    )[:80],
                    by="owner",
                )
            except ValueError as e:
                self._json(400, {"error": str(e)})
                return
            append_inbox(
                {
                    "kind": "alert",
                    "title": "Бан выдан",
                    "body": "client=%s ip=%s until=%s reason=%s"
                    % (
                        row.get("client_id") or "—",
                        row.get("ip") or "—",
                        row.get("until") or 0,
                        row.get("reason") or "",
                    ),
                    "room": row.get("room") or "",
                    "meta": {"ban_id": row.get("id")},
                }
            )
            self._json(200, {"ok": True, "ban": row})
            return

        if path in ("/admin/bans/lift", "/api/lounge/admin/bans/lift"):
            pwd = self.headers.get("X-Owner-Password") or ""
            if not owner_password_ok(pwd):
                self._json(401, {"error": "unauthorized"})
                return
            data = self._read_json()
            try:
                row = lift_ban(
                    ban_id=str(data.get("ban_id") or data.get("id") or "").strip(),
                    client_id=str(data.get("client_id") or "").strip(),
                    ip=str(data.get("ip") or "").strip(),
                    reason=str(data.get("reason") or "owner_lift")[:500],
                    by="owner",
                )
            except ValueError as e:
                self._json(400, {"error": str(e)})
                return
            append_inbox(
                {
                    "kind": "alert",
                    "title": "Бан снят",
                    "body": "ban_id=%s client=%s ip=%s"
                    % (
                        row.get("ban_id") or "—",
                        row.get("client_id") or "—",
                        row.get("ip") or "—",
                    ),
                    "room": "",
                    "meta": {"lift_id": row.get("id")},
                }
            )
            self._json(200, {"ok": True, "lift": row})
            return

        # C-243: host transfers moderator rights
        if path in (
            "/host/transfer",
            "/api/lounge/host/transfer",
        ):
            data = self._read_json()
            room_id = str(data.get("room") or "").strip()
            from_id = str(data.get("from_identity") or "").strip()
            to_id = str(data.get("to_identity") or "").strip()
            if not room_by_id(room_id):
                self._json(404, {"error": "room_not_found"})
                return
            try:
                result = transfer_host(room_id, to_id, from_identity=from_id)
                self._json(200, result)
            except PermissionError as e:
                self._json(403, {"error": str(e)})
            except ValueError as e:
                self._json(400, {"error": str(e)})
            except Exception as e:  # noqa: BLE001
                self._json(500, {"error": str(e)})
            return

        # C-243: any client can ask to promote if room has no host
        if path in (
            "/host/ensure",
            "/api/lounge/host/ensure",
        ):
            data = self._read_json()
            room_id = str(data.get("room") or "").strip()
            if not room_by_id(room_id):
                self._json(404, {"error": "room_not_found"})
                return
            result = promote_next_host_if_needed(room_id)
            self._json(200, result or {"ok": True, "unchanged": True})
            return

        if path in ("/moderation", "/api/lounge/moderation"):
            data = self._read_json()
            room_id = str(data.get("room") or "")
            action = str(data.get("action") or "")
            target = str(data.get("target_identity") or "")
            requester = str(data.get("requester_identity") or "")
            target_client = str(data.get("target_client_id") or "").strip()
            reason = str(data.get("reason") or "")[:200]
            if not room_by_id(room_id):
                self._json(404, {"error": "room_not_found"})
                return
            try:
                result = moderate_participant(
                    room_id,
                    action,
                    target,
                    requester,
                    target_client_id=target_client,
                    reason=reason,
                )
                append_mod_log(
                    {
                        "room": room_id,
                        "action": action,
                        "target": target,
                        "requester": requester,
                        "target_client_id": target_client,
                        "reason": reason,
                        "ok": True,
                    }
                )
                self._json(200, result)
            except PermissionError as e:
                append_mod_log(
                    {
                        "room": room_id,
                        "action": action,
                        "target": target,
                        "requester": requester,
                        "ok": False,
                        "error": str(e),
                    }
                )
                self._json(403, {"error": str(e)})
            except ValueError as e:
                self._json(400, {"error": str(e)})
            except Exception as e:  # noqa: BLE001
                self._json(500, {"error": str(e)})
            return

        if path in ("/chat", "/api/lounge/chat"):
            data = self._read_json()
            room_id = str(data.get("room") or "")
            client_id = str(data.get("client_id") or "").strip()
            if client_id and not SAFE_CLIENT.match(client_id):
                self._json(400, {"error": "bad_client_id"})
                return
            if not room_by_id(room_id):
                self._json(404, {"error": "room_not_found"})
                return
            # Auto-restrict may block chat for target
            if client_id:
                flags = get_restrictions(room_id, client_id)
                if flags and flags.get("chat"):
                    self._json(
                        403,
                        {
                            "error": "chat_restricted",
                            "hint": "Чат ограничен после жалоб",
                            "restrictions": flags,
                        },
                    )
                    return
            ip = client_ip_from_headers(
                self.headers, fallback=str(self.client_address[0] if self.client_address else "")
            )
            if is_banned(client_id, ip):
                self._json(
                    403,
                    {
                        "error": "banned",
                        "hint": "Доступ к комнатам Кампуса ограничен модерацией",
                    },
                )
                return
            try:
                msg = append_chat(
                    room_id,
                    str(data.get("name") or ""),
                    str(data.get("text") or ""),
                    client_id=client_id,
                    ip=ip,
                )
            except ValueError as e:
                err = str(e)
                if err == "BLOCKED_EXTREMISM_DETECTED":
                    self._json(
                        422,
                        {
                            "error": "BLOCKED_EXTREMISM_DETECTED",
                            "hint": "Сообщение отклонено: запрещённый контент",
                        },
                    )
                    return
                if err == "BLOCKED_OWNER_PATTERN":
                    # C-240: wipe attempt + kick offender from LiveKit
                    identity = str(data.get("identity") or "").strip()
                    if identity:
                        try:
                            remove_livekit_participant(room_id, identity)
                        except Exception as kick_err:  # noqa: BLE001
                            print("owner_pattern_kick:", kick_err)
                    self._json(
                        422,
                        {
                            "error": "BLOCKED_OWNER_PATTERN",
                            "hint": "Сообщение удалено. Нарушение правил — выход из комнаты.",
                            "kicked": bool(identity),
                        },
                    )
                    return
                self._json(400, {"error": err})
                return
            except Exception as e:  # noqa: BLE001
                self._json(500, {"error": str(e)})
                return
            self._json(
                200,
                {
                    "ok": True,
                    "message": msg,
                    "censored": bool(msg.get("censored")),
                },
            )
            return

        # C-240: after client sentinel hit — kick offender (self-enforce via identity)
        if path in (
            "/sentinel-enforce",
            "/api/lounge/sentinel-enforce",
        ):
            data = self._read_json()
            room_id = str(data.get("room") or "").strip()
            identity = str(data.get("identity") or "").strip()
            client_id = str(data.get("client_id") or "").strip()
            action = str(data.get("action") or "kick").strip().lower()
            if not room_by_id(room_id):
                self._json(404, {"error": "room_not_found"})
                return
            if not identity:
                self._json(400, {"error": "missing_identity"})
                return
            if client_id and not SAFE_CLIENT.match(client_id):
                self._json(400, {"error": "bad_client_id"})
                return
            if action != "kick":
                self._json(400, {"error": "bad_action"})
                return
            # Verify identity belongs to this client_id when possible
            if client_id:
                metas = list_participants_meta(room_id)
                match = next(
                    (p for p in metas if p.get("identity") == identity), None
                )
                if match and match.get("client_id") and match["client_id"] != client_id:
                    self._json(403, {"error": "identity_mismatch"})
                    return
            ok = remove_livekit_participant(room_id, identity)
            append_audit(
                {
                    "event": "SENTINEL_ENFORCE_KICK",
                    "room": room_id,
                    "identity": identity,
                    "client_id": client_id,
                    "ok": ok,
                }
            )
            self._json(200, {"ok": ok, "action": "kick", "identity": identity})
            return

        if path in ("/legal/consent", "/api/lounge/legal/consent"):
            data = self._read_json()
            client_id = str(data.get("client_id") or "").strip()
            room_id = str(data.get("room_id") or data.get("room") or "").strip()
            is_adult = bool(data.get("is_adult"))
            terms_accepted = bool(data.get("terms_accepted"))
            if not client_id or not SAFE_CLIENT.match(client_id):
                self._json(400, {"error": "bad_client_id"})
                return
            if room_id and not SAFE_ROOM.match(room_id):
                self._json(400, {"error": "bad_room"})
                return
            if not is_adult or not terms_accepted:
                self._json(
                    400,
                    {
                        "error": "consent_incomplete",
                        "hint": "Нужны оба согласия: 18+ и правила",
                    },
                )
                return
            consent_id = str(uuid.uuid4())
            session_id = str(uuid.uuid4())
            ip = client_ip_from_headers(
                self.headers, fallback=str(self.client_address[0] if self.client_address else "")
            )
            ua = (self.headers.get("User-Agent") or "")[:400]
            ts = int(time.time())
            append_legal_consent(
                {
                    "consent_id": consent_id,
                    "session_id": session_id,
                    "client_id": client_id,
                    "room_id": room_id or None,
                    "is_adult": True,
                    "terms_accepted": True,
                    "ip": ip,
                    "user_agent": ua,
                    "ts": ts,
                }
            )
            remember_legal_consent(client_id, consent_id, session_id, ts=ts)
            self._json(
                200,
                {
                    "ok": True,
                    "consent_id": consent_id,
                    "session_id": session_id,
                },
            )
            return

        if path in (
            "/moderation/canvas-violation",
            "/api/lounge/moderation/canvas-violation",
        ):
            data = self._read_json()
            room_id = str(data.get("room") or data.get("room_id") or "").strip()
            client_id = str(data.get("client_id") or "").strip()
            identity = str(data.get("identity") or "").strip()[:80]
            scores = data.get("scores") if isinstance(data.get("scores"), dict) else {}
            stroke_id = str(data.get("stroke_id") or "")[:64]
            if room_id and not SAFE_ROOM.match(room_id):
                self._json(400, {"error": "bad_room"})
                return
            if client_id and not SAFE_CLIENT.match(client_id):
                self._json(400, {"error": "bad_client_id"})
                return
            slim_scores = {
                str(k)[:32]: float(v)
                for k, v in scores.items()
                if isinstance(v, (int, float))
            }
            append_audit(
                {
                    "event": "CANVAS_VIOLATION",
                    "room": room_id,
                    "client_id": client_id,
                    "identity": identity,
                    "scores": slim_scores,
                    "stroke_id": stroke_id or None,
                    "ip": client_ip_from_headers(
                        self.headers,
                        fallback=str(self.client_address[0] if self.client_address else ""),
                    ),
                }
            )
            append_mod_log(
                {
                    "event": "CANVAS_VIOLATION",
                    "room": room_id,
                    "client_id": client_id,
                    "identity": identity,
                    "scores": slim_scores,
                }
            )
            self._json(200, {"ok": True})
            return

        # --- Phase 6 AI stubs (C-140…C-144). Always JSON; degrade without 5xx storm. ---
        if path in ("/ai/consent", "/api/lounge/ai/consent"):
            data = self._read_json()
            room_id = str(data.get("room") or "")
            identity = str(data.get("identity") or "").strip()[:80]
            client_id = str(data.get("client_id") or "").strip()
            granted = data.get("granted")
            if granted is None:
                granted = str(data.get("consent") or "").lower() in ("1", "true", "yes", "granted")
            else:
                granted = bool(granted)
            if room_id and not room_by_id(room_id):
                self._json(404, {"error": "room_not_found", "ok": False, "degraded": True})
                return
            append_ai_consent(
                {
                    "room": room_id,
                    "identity": identity,
                    "client_id": client_id if SAFE_CLIENT.match(client_id) else "",
                    "granted": granted,
                    "source": "api",
                }
            )
            self._json(
                200,
                {
                    "ok": True,
                    "granted": granted,
                    "hint": "Согласие записано (append-only). Локально также vernatun.lounge.aiConsent",
                },
            )
            return

        if path in ("/ai/stt", "/api/lounge/ai/stt"):
            data = self._read_json()
            room_id = str(data.get("room") or "")
            identity = str(data.get("identity") or "").strip()[:80]
            consent = bool(data.get("consent"))
            text = str(data.get("text") or data.get("transcript") or "")
            if room_id and not room_by_id(room_id):
                self._json(404, {"ok": False, "degraded": True, "error": "room_not_found"})
                return
            if not consent:
                self._json(
                    200,
                    {
                        "ok": False,
                        "degraded": True,
                        "error": "consent_required",
                        "hint": "Без согласия STT не вызывается",
                    },
                )
                return
            try:
                result = run_stt_text_first(text)
                result["identity"] = identity
                result["room"] = room_id
                self._json(200, result)
            except Exception as e:  # noqa: BLE001
                self._json(
                    200,
                    {
                        "ok": False,
                        "degraded": True,
                        "error": "stt_failed",
                        "hint": str(e)[:200],
                    },
                )
            return

        if path in ("/ai/coach", "/api/lounge/ai/coach"):
            data = self._read_json()
            room_id = str(data.get("room") or "")
            identity = str(data.get("identity") or "").strip()[:80]
            text = str(data.get("text") or "")
            lang = str(data.get("lang") or "ru")[:8]
            cefr = str(data.get("cefr") or "any")[:8]
            consent = bool(data.get("consent"))
            if room_id and not room_by_id(room_id):
                self._json(404, {"ok": False, "degraded": True, "error": "room_not_found"})
                return
            if not identity:
                self._json(
                    200,
                    {
                        "ok": False,
                        "degraded": True,
                        "error": "missing_identity",
                        "hint": "Нужен identity запросившего",
                    },
                )
                return
            try:
                result = run_private_coach(
                    room_id,
                    identity,
                    text,
                    lang=lang,
                    cefr=cefr,
                    consent=consent,
                )
                # Response is for requester only — never broadcast by API.
                self._json(200, result)
            except Exception as e:  # noqa: BLE001
                self._json(
                    200,
                    {
                        "ok": False,
                        "degraded": True,
                        "error": "coach_failed",
                        "hint": "Разбор временно недоступен",
                        "detail": str(e)[:200],
                        "notes": "",
                        "fillers": [],
                        "alternatives": [],
                    },
                )
            return

        if path in ("/ai/translate", "/api/lounge/ai/translate"):
            data = self._read_json()
            text = str(data.get("text") or "").strip()[:500]
            if not text:
                self._json(
                    200,
                    {
                        "ok": False,
                        "degraded": True,
                        "error": "empty_text",
                        "hint": "Нет текста для перевода",
                    },
                )
                return
            # Degraded stub: mirror text as phonetic; RU hint for lexicon UI.
            self._json(
                200,
                {
                    "ok": True,
                    "degraded": not bool(OPENAI_API_KEY),
                    "source": text,
                    "hy": text,
                    "phonetic": text[:80],
                    "ru": "перевод: %s" % text[:120],
                    "hint": (
                        "Черновой перевод (stub). С ключом OPENAI — уточним позже."
                        if not OPENAI_API_KEY
                        else "Перевод готов"
                    ),
                },
            )
            return

        if path in ("/webhooks/livekit", "/api/lounge/webhooks/livekit"):
            length = int(self.headers.get("Content-Length") or 0)
            body = self.rfile.read(length) if length else b""
            try:
                text = body[:4000].decode("utf-8", errors="replace")
                with WEBHOOK_LOG.open("a", encoding="utf-8") as f:
                    f.write("%s %s\n" % (int(time.time()), text))
                maybe_emit_ice_alert_from_webhook(text)
                # try parse room + clear chat if empty
                try:
                    evt = json.loads(body.decode("utf-8"))
                    room_name = (
                        (evt.get("room") or {}).get("name")
                        or evt.get("roomName")
                        or ""
                    )
                    event = evt.get("event") or evt.get("eventType") or ""
                    # C-255: also accept numeric LiveKit enums (2=left, 3=finished)
                    if room_name and is_livekit_leave_event(event):
                        # C-250: cascade host to next earliest joiner
                        departed = ""
                        try:
                            part = evt.get("participant") or {}
                            departed = str(
                                part.get("identity")
                                or part.get("sid")
                                or ""
                            )
                        except Exception:
                            departed = ""
                        try:
                            promote_next_host_if_needed(
                                str(room_name), departed_identity=departed
                            )
                        except Exception as pe:  # noqa: BLE001
                            print("webhook promote host:", pe)
                        # C-255: delayed force clear after last leave (LiveKit settle)
                        schedule_empty_check(str(room_name), 2.5)
                except Exception:
                    pass
            except Exception as e:  # noqa: BLE001
                self._json(500, {"error": str(e)})
                return
            self._json(200, {"ok": True})
            return

        self._json(404, {"error": "not_found"})


def main() -> None:
    print(
        "lounge api %s:%s rooms=%s inbox=%s owner_pw=%s"
        % (
            BIND,
            PORT,
            ROOMS_PATH,
            INBOX_PATH,
            "set" if OWNER_PASSWORD else "MISSING",
        )
    )
    t = threading.Thread(target=sfu_watch_loop, name="sfu-watch", daemon=True)
    t.start()
    # C-230: end sessions when LiveKit room is empty (webhook may miss)
    t2 = threading.Thread(
        target=session_empty_sweeper_loop, name="session-empty-sweep", daemon=True
    )
    t2.start()
    ThreadingHTTPServer((BIND, PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()

