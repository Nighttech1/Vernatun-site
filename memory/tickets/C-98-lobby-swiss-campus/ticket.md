# C-98 — Лобби `/lounge` → Campus Swiss Editorial

**P0** · W-38 · open

## Зона / Экран
React LobbyPage — `http://127.0.0.1:5173/lounge`

## Факт
Лобби — простой список magazine-row. Референс campus: editorial hero, live stats, фильтр-табы CEFR, **сетка карточек** комнат (LIVE badges, уровень, CTA), правило среды.

## Ожидание (визуал по рефу, данные из API)
1. Sticky header в стиле Campus (бренд VERNATUN CAMPUS / Lounge LIVE)
2. Hero: заголовок + краткий lead + CTA «Быстрый вход» (в первую открытую/`open` комнату) + ссылка на правила (`/ROOM_RULES` или stub)
3. Фильтры CEFR как табы/chips в духе рефа (не ломать API)
4. Сетка карточек 1→2→3 колонки: title, description, cefr badge, online, CTA «Присоединиться»
5. LIVE/онлайн индикатор если `online > 0`
6. Desktop 1440 + mobile: одна колонка на ~390, без горизонтального скролла
7. Не копировать фейковые «создать воркшоп» / демо-аватары как обязательный функционал; плейсхолдер «создать» — опционально disabled/P2

## Приоритет
P0

## Скрин-улика
Реф campus + after `memory/waves/W-38-after-lobby-*.png`

## Зона
Frontend (+ лёгкий Motion: pulse LIVE-dot)
