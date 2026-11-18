# Guards — C-130 Inbox API + SFU

1. `owner_inbox.jsonl` append-only.
2. `GET /api/lounge/admin/inbox` с `X-Owner-Password` = `LOUNGE_OWNER_PASSWORD`.
3. Report пишет kind=report + body; SFU poll пишет kind=alert при down (cooldown).
4. Без wipe файлов данных.
