# C-133 — LiveKit webhook URL → backend

**P1** · W-48 · closed

## Ожидание
- В `livekit.yaml` (и template VPS) указать webhook URL на `lounge_api` `/api/lounge/webhooks/livekit` (localhost: host.docker.internal:8765).
- Endpoint уже append-only в `webhooks.log` — проверить/документировать.
- Data-safety: только append.

## Зона
Infra + Docs
