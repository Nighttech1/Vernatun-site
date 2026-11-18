# Guards — C-138 Moderation audit log

## Checks
- [x] `GET /api/lounge/admin/moderation?limit=` + `X-Owner-Password` → JSON items (newest first)
- [x] 401 without / wrong password
- [x] Read-only `moderation.log` (utf-8-sig); no truncate/wipe
- [x] Owner Inbox вкладка «Модерация» показывает MUTE/KICK
- [x] visual/after.png — кабинет с вкладкой Модерация

## Smoke
```
curl -H "X-Owner-Password: …" http://127.0.0.1:8765/api/lounge/admin/moderation?limit=5
```
Localhost admin: http://127.0.0.1:5174/
