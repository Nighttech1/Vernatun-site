#!/usr/bin/env python3
"""Public token endpoint for Vernatun test-room (VPS). Secrets from env only."""

from __future__ import annotations

import asyncio
import json
import os
import re
import time
from datetime import timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

API_KEY = os.environ["LIVEKIT_API_KEY"]
API_SECRET = os.environ["LIVEKIT_API_SECRET"]
LIVEKIT_URL = os.environ.get("LIVEKIT_PUBLIC_URL", "wss://vernatunspeakclub.com")
# RoomService HTTP (local)
LIVEKIT_HTTP = os.environ.get("LIVEKIT_HTTP_URL", "http://127.0.0.1:7880")
ROOM = os.environ.get("LIVEKIT_ROOM", "vernatun-smoke")
PORT = int(os.environ.get("MEET_PORT", "8765"))
BIND = os.environ.get("MEET_BIND", "127.0.0.1")

AHPERIK_RE = re.compile(r"ахперик\s+(\d+)", re.IGNORECASE)


def next_ahperik_number() -> int:
    """List current room participants and return next free N for «ахперик N»."""
    from livekit import api

    async def _run() -> int:
        lk = api.LiveKitAPI(LIVEKIT_HTTP, API_KEY, API_SECRET)
        used: set[int] = set()
        try:
            res = await lk.room.list_participants(api.ListParticipantsRequest(room=ROOM))
            for p in res.participants or []:
                for text in (p.name or "", p.identity or ""):
                    m = AHPERIK_RE.search(text)
                    if m:
                        used.add(int(m.group(1)))
                    m2 = re.search(r"ahperik[_-]?(\d+)", text, re.I)
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
        return int(time.time()) % 1000 + 1


def make_token(identity: str, name: str) -> str:
    from livekit import api

    grant = api.VideoGrants(
        room_join=True,
        room=ROOM,
        can_publish=True,
        can_subscribe=True,
        can_publish_data=True,
    )
    return (
        api.AccessToken(API_KEY, API_SECRET)
        .with_identity(identity)
        .with_name(name)
        .with_grants(grant)
        .with_ttl(timedelta(hours=2))
        .to_jwt()
    )


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:  # noqa: A003
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))

    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "https://vernatunspeakclub.com")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path not in ("/token", "/api/lounge/token", "/"):
            self.send_response(404)
            self.end_headers()
            return
        if parsed.path == "/" and not parsed.query:
            body = b"ok"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        try:
            n = next_ahperik_number()
            display_name = "ахперик %d" % n
            identity = "ahperik-%d-%d" % (n, int(time.time()) % 100000)
            token = make_token(identity, display_name)
            payload = json.dumps(
                {
                    "token": token,
                    "url": LIVEKIT_URL,
                    "room": ROOM,
                    "display_name": display_name,
                    "identity": identity,
                    "issued_at": int(time.time()),
                },
                ensure_ascii=False,
            ).encode("utf-8")
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        except Exception as e:  # noqa: BLE001
            err = json.dumps({"error": str(e)}, ensure_ascii=False).encode("utf-8")
            self.send_response(500)
            self._cors()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(err)))
            self.end_headers()
            self.wfile.write(err)


def main() -> None:
    print("token server %s:%s -> %s room=%s" % (BIND, PORT, LIVEKIT_URL, ROOM))
    ThreadingHTTPServer((BIND, PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
