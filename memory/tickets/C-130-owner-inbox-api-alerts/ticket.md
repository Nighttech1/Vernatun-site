# C-130 — Owner Inbox API + алерты SFU

**P1** · W-47 · closed

## Ожидание
- Append-only `owner_inbox.jsonl` (или расширение reports): типы `report` | `alert`.
- `GET /api/lounge/admin/inbox` + `Authorization: Bearer <password>` или header `X-Owner-Password` = `LOUNGE_OWNER_PASSWORD`.
- Жалоба POST `/report` пишет в inbox с `id`, `body` (текст), timestamps.
- Фоновый health SFU: если LiveKit HTTP недоступен — запись alert (дедуп ≥5 мин).
- Data-safety: только append, без wipe.

## Зона
Backend
