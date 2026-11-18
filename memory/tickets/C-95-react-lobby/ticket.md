# C-95 — React-лобби: список комнат + вход

**P0** · W-37 · **closed** + guards (await Client 2026-09-20)

## Зона / Экран
`/lounge` — список комнат. Frontend A.

## Факт
Static-лобби уже тянет `GET /api/lounge/rooms` и ведёт на `/room?room=`. В Фазе 3 нужно то же в React: фильтр по языку/уровню, CTA «Войти», без ухода в Discord.

## Ожидание
- Список комнат из существующего API (`id`, `title`, `cefr`, `online`, `description`)
- Фильтр CEFR / «открытая» (минимум: chips или select)
- Клик / CTA → переход в room shell с `room` id (deep-link сохраняется)
- Desktop 1440 + mobile одна колонка, без горизонтального скролла
- Визуально в семье сайта (magazine-row / parchment), не generic dashboard

## Приоритет
P0

## Скрин-улика
Baseline prod `/lounge` (W-37).

## Зона
Frontend
