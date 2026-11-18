# C-94 — Каркас React SPA Lounge

**P0** · W-37 · open

## Зона / Экран
`liverooms/web` → маршруты `/lounge`, `/room` (замена static MVP по плану фазы 3).

## Факт
Сейчас лобби и комната — static HTML + Alpine (`lounge.html`, `room.html`). В `ARCHITECTURE.md` и `DEVELOPMENT_PLAN.md` фаза 3 требует **React SPA** + `@livekit/components-react`, не generic purple SaaS.

## Ожидание
- Vite + React + TypeScript в `liverooms/web/`
- Токены бренда Вернатун (azure / terracotta / parchment / Century Gothic) — как на лендинге
- Dev-сервер на localhost; сборка отдаётся рядом со static или через nginx `/lounge` + `/room`
- Static `lounge.html` / `room.html` пока не ломаем (fallback до cutover)

## Приоритет
P0

## Зона
Frontend (+ Deployer: localhost serve)

## Acceptance
На localhost открывается SPA-оболочка с брендом Вернатун (не шаблон Vite default).
