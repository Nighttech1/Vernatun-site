# Architect-spec — W-47 Owner Inbox + create room

## Цель
Жалобы с текстом и алерты SFU стекаются в закрытый кабинет владельца (пароль). Telegram HITL снят с плана. Параллельно — создание комнат с паролем.

## Инварианты
- Data-safety: append inbox/rooms; пароль только env `LOUNGE_OWNER_PASSWORD`.
- Multi-party / mute-by-default без изменений.
- VPS нет без «да»; домен admin — позже.
- Admin UI не публикует пароль в бандле — только prompt пользователя.

## Inbox модель (JSONL строка)
```json
{
  "id": "uuid",
  "ts": 1710000000,
  "kind": "report|alert",
  "room": "open",
  "reporter_identity": "...",
  "target_identity": "...|",
  "target_client_id": "",
  "body": "текст жалобы",
  "reason": "user_report",
  "new_trust": 85,
  "title": "короткий заголовок для списка",
  "meta": {}
}
```

## API
- `POST /api/lounge/report` — body до 2000 символов; target опционален (room-level); всегда append inbox.
- `GET /api/lounge/admin/inbox?limit=100` — header `X-Owner-Password`.
- `POST /api/lounge/admin/alert` — внутренний/health stub (тот же header) для ручных тестов.
- SFU poll: каждые 60с HEAD/GET LIVEKIT_HTTP; fail → alert title «SFU down».

## Admin UI `liverooms/admin/`
- index.html + styles (tokens azure/parchment) + app.js
- Login gate → fetch inbox → list buttons → detail panel
- Dev: vite proxy `/api` или открывать через тот же API origin; script `npm run admin` serve :5174

## Create room (C-131)
- `rooms_dynamic.json` рядом с seed; merge на GET /rooms
- password: store bcrypt or sha256+salt simple (stdlib hashlib + salt) — `password_ok` check on token
- Lobby: unlock create card

## Chain
```
Архитектор
→ Backend (C-130, C-131 API, report body)
→ Frontend room (C-128) + admin (C-129) + lobby create (C-131)
→ Docs (C-127)
→ Тестировщик → Фиксер → Деплоер localhost → Клиент
```
