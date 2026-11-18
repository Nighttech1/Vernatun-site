#!/usr/bin/env python3
"""Smoke-check LiveKit HTTP reachability. Does not delete or mutate rooms.

Usage:
  set LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET
  python plugins/realtime/livekit_health_check.py
  python plugins/realtime/livekit_health_check.py --url http://127.0.0.1:7880
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request


def main() -> int:
    parser = argparse.ArgumentParser(description="LiveKit health smoke check")
    parser.add_argument(
        "--url",
        default=os.environ.get("LIVEKIT_URL", "http://127.0.0.1:7880"),
        help="LiveKit HTTP base URL",
    )
    args = parser.parse_args()
    base = args.url.rstrip("/")

    # Public-ish readiness: many installs expose / on RTC; prefer configured health if any.
    candidates = [f"{base}/", f"{base}/v1"]
    last_err = None
    for url in candidates:
        try:
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=5) as resp:
                status = resp.status
                body = resp.read(200).decode("utf-8", errors="replace")
                print(
                    json.dumps(
                        {
                            "ok": status < 500,
                            "url": url,
                            "status": status,
                            "snippet": body[:120],
                            "hint": "Configure keys and use livekit-cli list-rooms for full auth check",
                        },
                        ensure_ascii=False,
                    )
                )
                return 0 if status < 500 else 1
        except urllib.error.HTTPError as e:
            # HTTP response still means process is up
            print(
                json.dumps(
                    {
                        "ok": True,
                        "url": url,
                        "status": e.code,
                        "hint": "Server responded; run authenticated livekit-cli next",
                    },
                    ensure_ascii=False,
                )
            )
            return 0
        except Exception as e:  # noqa: BLE001 — smoke tool
            last_err = str(e)

    print(
        json.dumps(
            {
                "ok": False,
                "url": base,
                "error": last_err,
                "hint": "SFU unreachable — check Docker, ports, LIVEKIT_URL",
            },
            ensure_ascii=False,
        )
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
