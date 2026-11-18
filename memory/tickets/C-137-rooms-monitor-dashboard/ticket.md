# C-137 — Дашборд мониторинга комнат (localhost)

**P2** · W-49 · open

## Зона / Экран
Infra · Prometheus + Grafana (или livekit-monitor) поверх уже существующего scrape LiveKit

## Факт
W-48: Prometheus scrape LiveKit (`profile metrics`, :9090). Нет визуального дашборда комнат для владельца/ops на localhost.

## Ожидание
- Grafana (или эквивалент) в `docker compose --profile metrics` на localhost.
- Дашборд: комнаты / участники / базовые LiveKit profile metrics (по наличию в scrape).
- Документация в `liverooms/infra/README.md`: как поднять и открыть URL.
- Без Telegram; без VPS/prod.

## Приоритет
P2

## Зона
Backend / Infra (Realtime ops)

## Скрин-улика
Скрин Grafana localhost или Prometheus+dashboard после поднятия profile
