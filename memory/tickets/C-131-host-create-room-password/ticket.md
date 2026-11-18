# C-131 — Создание комнаты host + пароль

**P1** · W-47 · closed

## Ожидание
- `POST /api/lounge/rooms` — создать комнату (id, title, cefr, optional password_hash).
- Вход: `POST /token` или query `password=` для locked комнат.
- UI лобби: форма «Создать комнату» (вместо aria-disabled create card) + поле пароля при входе в locked.
- Data-safety: append в rooms.json / отдельный `rooms_dynamic.json`, без wipe seed.

## Зона
Backend + Frontend
