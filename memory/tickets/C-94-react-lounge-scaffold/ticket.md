# C-94 — Каркас React SPA Lounge

**P0** · W-37 · **closed** + guards (await Client 2026-09-20)

## Зона / Экран
Lounge — весь раздел `/lounge` (и маршруты комнаты). Frontend A (premium web).

## Факт
Сейчас `/lounge` и `/room` — static HTML + Alpine + UMD LiveKit. В каноне `ARCHITECTURE.md` / Фаза 3 плана — **React + `@livekit/components-react`**, отдельно от Alpine-лендинга. SPA в репозитории нет.

## Ожидание
- Vite + React + TypeScript каркас в `liverooms/web/`
- Токены бренда Вернатун (azure / terracotta / parchment / Century Gothic), не purple SaaS
- Dev-сервер на localhost; prod-сборка отдаётся под `/lounge` (и room-маршрут)
- Static MVP не ломаем до cutover: либо параллельный путь, либо замена только после зелёной сборки

## Приоритет
P0

## Скрин-улика
`memory/waves/W-37-baseline-lounge-desktop.png` — текущий static baseline (prod).

## Зона
Frontend (+ Deployer на nginx/static serve)
