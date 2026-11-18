#!/usr/bin/env python3
"""Local token + static meet server for dual-peer smoke (фаза 1).

Dev LiveKit keys default to --dev pair: devkey / secret.
Does not delete any data. Secrets from env or liverooms/infra/.env.
"""

from __future__ import annotations

import json
import os
import time
from datetime import timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
INFRA = ROOT.parent / "infra"


def load_dotenv() -> None:
    env_path = INFRA / ".env"
    if not env_path.is_file():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


load_dotenv()

API_KEY = os.environ.get("LIVEKIT_API_KEY", "devkey")
API_SECRET = os.environ.get("LIVEKIT_API_SECRET", "secret")
LIVEKIT_URL = os.environ.get("LIVEKIT_URL", "ws://127.0.0.1:7880")
PORT = int(os.environ.get("MEET_PORT", "8765"))
ROOM = os.environ.get("LIVEKIT_ROOM", "vernatun-smoke")


def make_token(identity: str, name: str) -> str:
    try:
        from livekit import api
    except ImportError as e:
        raise SystemExit(
            "Install: pip install livekit-api\n" + str(e)
        ) from e

    grant = api.VideoGrants(
        room_join=True,
        room=ROOM,
        can_publish=True,
        can_subscribe=True,
        can_publish_data=True,
    )
    token = (
        api.AccessToken(API_KEY, API_SECRET)
        .with_identity(identity)
        .with_name(name)
        .with_grants(grant)
        .with_ttl(timedelta(hours=1))
    )
    return token.to_jwt()


INDEX_HTML = """<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vernatun Lounge — smoke (multi-speak)</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; }
    button { margin: 0.25rem 0.25rem 0.25rem 0; padding: 0.5rem 1rem; }
    #status { margin: 1rem 0; padding: 0.75rem; background: #f4f0e8; border-radius: 8px; }
    .hint { color: #444; font-size: 0.95rem; line-height: 1.45; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/livekit-client@2.9.1/dist/livekit-client.umd.min.js"></script>
</head>
<body>
  <h1>Vernatun smoke</h1>
  <p class="hint">Модель как TeamSpeak: несколько человек говорят <strong>одновременно</strong> и слышат друг друга.
  Откройте второе окно с другим <code>?as=</code> и оба нажмите Unmute.</p>
  <p>Участник: <strong id="who"></strong> · комната: <code id="room"></code></p>
  <div>
    <button id="join">Join</button>
    <button id="mute" disabled>Unmute</button>
    <button id="leave" disabled>Leave</button>
  </div>
  <div id="status">Не в комнате</div>
  <ul id="peers"></ul>
  <script>
    const params = new URLSearchParams(location.search);
    const who = params.get('as') || 'a';
    document.getElementById('who').textContent = who;
    document.getElementById('room').textContent = 'vernatun-smoke';

    let room = null;
    let micOn = false;
    const statusEl = document.getElementById('status');
    const peersEl = document.getElementById('peers');
    const muteBtn = document.getElementById('mute');

    function setStatus(t) { statusEl.textContent = t; }

    function renderPeers() {
      peersEl.innerHTML = '';
      if (!room) return;
      room.remoteParticipants.forEach((p) => {
        const li = document.createElement('li');
        li.textContent = p.identity + (p.isSpeaking ? ' · говорит' : '');
        peersEl.appendChild(li);
      });
    }

    document.getElementById('join').onclick = async () => {
      const res = await fetch('/token?identity=' + encodeURIComponent(who) + '&name=' + encodeURIComponent(who));
      const data = await res.json();
      if (!res.ok) { setStatus(data.error || 'token error'); return; }
      const { Room, RoomEvent, createLocalAudioTrack } = LivekitClient;
      room = new Room({ adaptiveStream: true, dynacast: true });
      room.on(RoomEvent.ParticipantConnected, renderPeers);
      room.on(RoomEvent.ParticipantDisconnected, renderPeers);
      room.on(RoomEvent.ActiveSpeakersChanged, renderPeers);
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === 'audio') {
          const el = track.attach();
          el.autoplay = true;
          document.body.appendChild(el);
        }
      });
      await room.connect(data.url, data.token);
      setStatus('В комнате (mic off). Нажмите Unmute — можно говорить параллельно с другими.');
      muteBtn.disabled = false;
      document.getElementById('leave').disabled = false;
      renderPeers();
      window.__createLocalAudioTrack = createLocalAudioTrack;
    };

    muteBtn.onclick = async () => {
      if (!room) return;
      if (!micOn) {
        const track = await window.__createLocalAudioTrack();
        await room.localParticipant.publishTrack(track);
        micOn = true;
        muteBtn.textContent = 'Mute';
        setStatus('Микрофон включён — говорите одновременно с вторым окном.');
      } else {
        room.localParticipant.audioTrackPublications.forEach((pub) => {
          if (pub.track) pub.track.stop();
          pub.unmute && pub.mute();
        });
        await room.localParticipant.setMicrophoneEnabled(false);
        micOn = false;
        muteBtn.textContent = 'Unmute';
        setStatus('Микрофон выключен.');
      }
    };

    document.getElementById('leave').onclick = async () => {
      if (room) { await room.disconnect(); room = null; }
      micOn = false;
      muteBtn.disabled = true;
      muteBtn.textContent = 'Unmute';
      document.getElementById('leave').disabled = true;
      setStatus('Вышли.');
      peersEl.innerHTML = '';
    };
  </script>
</body>
</html>
"""


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:  # noqa: A003
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path in ("/", "/index.html"):
            body = INDEX_HTML.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if parsed.path == "/token":
            qs = parse_qs(parsed.query)
            identity = (qs.get("identity") or ["guest"])[0][:64]
            name = (qs.get("name") or [identity])[0][:64]
            try:
                token = make_token(identity, name)
                payload = json.dumps(
                    {"token": token, "url": LIVEKIT_URL, "room": ROOM, "issued_at": int(time.time())}
                ).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
            except Exception as e:  # noqa: BLE001
                err = json.dumps({"error": str(e)}).encode("utf-8")
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(err)))
                self.end_headers()
                self.wfile.write(err)
            return
        self.send_response(404)
        self.end_headers()


def main() -> None:
    print("Meet smoke http://127.0.0.1:%s/  LiveKit=%s key=%s" % (PORT, LIVEKIT_URL, API_KEY))
    print("Open second window: http://127.0.0.1:%s/?as=b" % PORT)
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
