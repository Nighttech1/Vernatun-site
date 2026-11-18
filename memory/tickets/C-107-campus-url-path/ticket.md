# C-107 — URL Кампуса: `/campus`, не `/lounge`

**P0** · W-41 · closed + guards

## Зона / Экран
React SPA routes · `liverooms/web/src/App.tsx`, Layout, RoomPage navigate

## Факт
SPA открывается как `http://127.0.0.1:5173/lounge` и `/room?room=…`. В UI уже «Кампус», но в ссылке остаётся «lounge». Заказчик: в ссылке должно быть **campus**.

## Ожидание
- Канон публичных путей SPA: **`/campus`** (лобби) + **`/room?room=`** (комната без смены имени room).
- Редирект `/lounge` → `/campus` (и `/lounge/` → `/campus`) для старых закладок.
- Внутренние Link/navigate на `/campus`.
- API `/api/lounge/*` **не ломать** в этой волне (backend path остаётся; только фронт-URL).
- Prod cutover / nginx — **не** в этой волне (отдельный тикет после вердикта + явное «да» на VPS).
- Static `lounge.html` / `room.html` не удалять.

## Приоритет
P0

## Скрин-улика
Адресная строка after: `…/campus` · `visual/after-url-campus.png` · guards.md

## Зона
Frontend
