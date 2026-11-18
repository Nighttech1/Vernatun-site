#!/usr/bin/env python3
"""Spacedeck Open client for Vernatun Lounge: provision Instant Edit Spaces + purge."""

from __future__ import annotations

import json
import os
import shutil
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

BASE = Path(__file__).resolve().parent
SPACEDECK_URL = os.environ.get("SPACEDECK_URL", "http://127.0.0.1:9666").rstrip("/")
SPACEDECK_EMAIL = os.environ.get(
    "SPACEDECK_EMAIL", "campus-bot@vernatun.local"
).lower()
SPACEDECK_PASSWORD = os.environ.get(
    "SPACEDECK_PASSWORD", "vernatun-board-bot-local"
)
SPACEDECK_INVITE = os.environ.get("SPACEDECK_INVITE_CODE", "vernatun-local")
SPACEDECK_NICK = os.environ.get("SPACEDECK_NICKNAME", "Campus Bot")
BOARD_MAP_PATH = Path(
    os.environ.get("LOUNGE_BOARD_MAP_PATH", str(BASE / "board_spaces.json"))
)
# Local Spacedeck media root (docker volume ./storage)
STORAGE_ROOT = Path(
    os.environ.get(
        "SPACEDECK_STORAGE_ROOT",
        str(BASE.parent / "spacedeck" / "storage"),
    )
)


def _http(
    method: str,
    path: str,
    body: dict | None = None,
    token: str | None = None,
) -> tuple[int, Any]:
    url = SPACEDECK_URL + path
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["X-Spacedeck-Auth"] = token
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            raw = res.read().decode("utf-8", errors="replace")
            try:
                parsed = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                parsed = {"raw": raw}
            return res.status, parsed
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            parsed = {"raw": raw, "error": str(e)}
        return e.code, parsed
    except Exception as e:  # noqa: BLE001
        return 0, {"error": str(e)}


def _load_map() -> dict[str, dict]:
    if not BOARD_MAP_PATH.is_file():
        return {}
    try:
        data = json.loads(BOARD_MAP_PATH.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _save_map(data: dict[str, dict]) -> None:
    BOARD_MAP_PATH.parent.mkdir(parents=True, exist_ok=True)
    BOARD_MAP_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def _signup_if_needed() -> None:
    code, _ = _http(
        "POST",
        "/api/users",
        {
            "email": SPACEDECK_EMAIL,
            "nickname": SPACEDECK_NICK,
            "password": SPACEDECK_PASSWORD,
            "password_confirmation": SPACEDECK_PASSWORD,
            "invite_code": SPACEDECK_INVITE,
        },
    )
    # 201 created, 400 already exists — both OK
    if code not in (201, 400, 200):
        pass


def _login() -> str:
    _signup_if_needed()
    code, data = _http(
        "POST",
        "/api/sessions",
        {"email": SPACEDECK_EMAIL, "password": SPACEDECK_PASSWORD},
    )
    if code not in (200, 201) or not isinstance(data, dict):
        raise RuntimeError("spacedeck_login_failed:%s:%s" % (code, data))
    token = data.get("token")
    if not token:
        raise RuntimeError("spacedeck_no_token")
    return str(token)


def _create_space(token: str, room_id: str) -> dict:
    code, data = _http(
        "POST",
        "/api/spaces",
        {"name": "Vernatun · %s" % room_id, "space_type": "space"},
        token=token,
    )
    if code not in (200, 201) or not isinstance(data, dict):
        raise RuntimeError("spacedeck_create_failed:%s:%s" % (code, data))
    space_id = data.get("_id")
    edit_hash = data.get("edit_hash")
    if not space_id or not edit_hash:
        raise RuntimeError("spacedeck_missing_ids:%s" % data)
    return {"space_id": str(space_id), "edit_hash": str(edit_hash)}


def board_embed_url(
    space_id: str, edit_hash: str, nickname: str | None = None
) -> str:
    # Instant Edit Link — no Spacedeck account required for guests
    from urllib.parse import quote

    url = "%s/spaces/%s?spaceAuth=%s" % (SPACEDECK_URL, space_id, edit_hash)
    nick = (nickname or "").strip()[:40]
    if nick:
        url += "&nickname=%s" % quote(nick)
    return url


def ensure_board(room_id: str, nickname: str | None = None) -> dict:
    """Return Instant Edit URL for room; create Space if missing."""
    m = _load_map()
    entry = m.get(room_id)
    if entry and entry.get("space_id") and entry.get("edit_hash"):
        return {
            "ok": True,
            "url": board_embed_url(
                entry["space_id"], entry["edit_hash"], nickname
            ),
            "space_id": entry["space_id"],
            "provisioned": False,
        }
    token = _login()
    created = _create_space(token, room_id)
    m[room_id] = created
    _save_map(m)
    return {
        "ok": True,
        "url": board_embed_url(
            created["space_id"], created["edit_hash"], nickname
        ),
        "space_id": created["space_id"],
        "provisioned": True,
    }


def _wipe_storage_for_space(space_id: str) -> int:
    """Delete local Spacedeck media for space (PDF pages, images)."""
    if not STORAGE_ROOT.is_dir():
        return 0
    removed = 0
    prefix = "s" + space_id
    # mock-aws-s3 layout: storage/<bucket>/<key>
    for root, dirs, files in os.walk(STORAGE_ROOT, topdown=False):
        root_p = Path(root)
        # remove files whose path contains s{space_id}
        for name in files:
            fp = root_p / name
            if prefix in str(fp):
                try:
                    fp.unlink()
                    removed += 1
                except OSError:
                    pass
        for name in dirs:
            dp = root_p / name
            if prefix in str(dp) or dp.name == prefix:
                try:
                    shutil.rmtree(dp, ignore_errors=True)
                    removed += 1
                except OSError:
                    pass
    return removed


def purge_board(room_id: str) -> dict:
    """Delete Space + media when room session ends (0 participants)."""
    m = _load_map()
    entry = m.pop(room_id, None)
    if entry is None:
        _save_map(m)
        return {"ok": True, "purged": False, "reason": "no_board"}
    space_id = entry.get("space_id") or ""
    files = _wipe_storage_for_space(space_id) if space_id else 0
    api_ok = False
    if space_id:
        try:
            token = _login()
            code, _ = _http("DELETE", "/api/spaces/%s" % space_id, token=token)
            # Also try with empty body — Spacedeck requires admin role via middleware
            api_ok = code in (200, 204, 404)
            if not api_ok:
                # retry DELETE sometimes needs spaceAuth for role? Admin needs user.
                code2, _ = _http(
                    "DELETE",
                    "/api/spaces/%s" % space_id,
                    body={},
                    token=token,
                )
                api_ok = code2 in (200, 204, 404)
        except Exception:
            api_ok = False
    _save_map(m)
    return {
        "ok": True,
        "purged": True,
        "space_id": space_id,
        "files_removed": files,
        "api_ok": api_ok,
    }
