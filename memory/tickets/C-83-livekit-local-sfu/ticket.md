# C-83 — LiveKit SFU localhost (фаза 1)

**P0** · Волна W-32 · Статус: open

## Суть

Поднять **свой** LiveKit Server в Docker на машине разработки: ключи в `.env` (не в git), healthcheck зелёный, конфиг под аудио-комнаты с несколькими одновременными публикаторами.

## Acceptance

1. `docker compose` в `liverooms/infra/` поднимает LiveKit.
2. Health script / API отвечает без 5xx.
3. API key/secret только в `liverooms/infra/.env` (в `.gitignore`).
4. Документирован порт и как подключиться двум браузерам.

## Вне scope этой волны

Полный React Lounge UI (фаза 3); prod VPS.
