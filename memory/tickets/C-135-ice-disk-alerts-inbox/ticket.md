# C-135 — Алерты ICE / диск webhook → Inbox

**P1** · W-48 · closed

## Ожидание
- В lounge_api: если `webhooks.log` > порога (напр. 50 MB) → inbox alert `webhook_log_large` (cooldown).
- При webhook payload с явными ICE/connection fail маркерами (best-effort parse) → inbox `ice_errors` (cooldown).
- Без wipe логов.

## Зона
Backend
