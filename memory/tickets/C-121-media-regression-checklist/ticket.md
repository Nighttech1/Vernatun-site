# C-121 — Регресс медиа: token / kick / host / TURN

**P0** · W-46 · closed

## Ожидание
- Чеклист регресса в `liverooms/REGRESSION.md` + guards тикета.
- Сценарии: токен expired / отказ token; kick → экран «исключён»; host disconnect (комната не падает для остальных); TURN-only (как проверить на VPS/LTE).
- Не замена dual-peer audio e2e; ссылка на C-120.

## Зона
Docs + Frontend (проверка экранов kick/ended уже есть)
