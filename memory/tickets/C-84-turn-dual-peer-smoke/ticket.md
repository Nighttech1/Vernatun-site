# C-84 — TURN + dual-peer smoke (фаза 1)

**P0** · Волна W-32 · Статус: open

## Суть

Coturn/TURN рядом с LiveKit (или в том же compose) + минимальная тестовая страница, где **два участника** могут говорить **одновременно** и слышать друг друга на localhost.

## Acceptance

1. TURN сервис в compose (хотя бы для localhost/dev).
2. Тестовая HTML/страница meet с токеном (dev) без секретов в git.
3. Guard: инструкция dual-peer; health check в `guards.md`.
4. Критерий фазы 1: зафиксирован путь проверки «два браузера слышат друг друга».

## Примечание

Playwright не заменяет ручной dual-peer звук — в guard явно.
