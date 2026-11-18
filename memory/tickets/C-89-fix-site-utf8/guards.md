# Guards W-35

## C-89 UTF-8
- [x] Local HTML fixed via ftfy (`О нашем клубе` in index.html)
- [x] VPS index verified True/True for Russian markers
- [x] Public homepage readable (spot-check)

## C-90 API
- [x] `GET /api/lounge/rooms` returns seeded rooms + online
- [x] `GET /api/lounge/token?room=open` returns JWT + display_name
- [x] webhook stub path exists (append-only log)

## C-91 Lobby
- [x] https://vernatunspeakclub.com/lounge → 200
- [x] Nav «Голосовые комнаты» in site.js
- [ ] Manual: enter room from lobby, hear peers (Client)
