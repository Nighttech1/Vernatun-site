# Architect-spec — W-35 / C-89–C-91

## C-89 (done in-wave)
ftfy restore UTF-8 on HTML; deploy to VPS. Verified `О нашем клубе` on server.

## C-90 Backend Lounge API
Extend VPS service at `liverooms/infra/vps/` (token_server → lounge_api.py):

| Endpoint | Behavior |
|----------|----------|
| `GET /api/lounge/rooms` | JSON list: id, title, cefr, locked, online (from LiveKit list if possible) |
| `GET /api/lounge/token?room=<id>` | JWT + display_name ахперик N for that room; multi-speak grants |
| `POST /api/lounge/webhooks/livekit` | stub log (no delete) |

Seed rooms: `open`, `a1`, `b1`, `slang`, `vernatun-smoke` (test).  
Store seed in `rooms.json` next to service (not wipe).  
systemd: replace token_server with lounge_api (same port 8765).

## C-91 Frontend `/lounge`
Page like contacts style + room cards → join flow (reuse test-room speaking UI).  
Nav: «Голосовые комнаты» → /lounge; keep «Тест комната» or merge link into lounge.

## Chain
C-89 Fixer/Deployer (encoding) → Backend (C-90) → Frontend (C-91) → Deployer → Tester → Client
