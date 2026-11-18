# C-106 — Azure вместо navy как главный синий Кампуса

**P0** · W-41 · closed + guards

## Зона / Экран
Lounge SPA лобби + room · `liverooms/web/` · desktop 1440 + iPhone/Android

## Факт
На localhost `http://127.0.0.1:5173/lounge` основной «синий» — тёмно-синий navy `#1E293B` / slate `#0F172A`:
- токены `--brand-navy`, `--color-azure` алиасит на navy (ошибка бренда);
- featured-карточка, кнопки «Присоединиться к эфиру», активный chip фильтра, заголовки/инк.
Сайт vernatunspeakclub.com использует **azure `#2A5A84`**, parchment `#F9F6F0`, terracotta `#C95B36`.

## Ожидание по DESIGN.md / сайту
- Главный синий/инк/кнопки-карточек = **azure ≈ `#2A5A84`** (как `js/tailwind-config.js`, `css/site.css`).
- Terracotta `#C95B36` / `#C25E28` — CTA/акценты (можно оставить).
- Фон — светлый parchment/surface.
- Обновить `tokens.css` + `DESIGN.md` + все места, где navy — «главный синий».
- After-скрины desktop + iPhone + Android; визуально ближе к живому сайту.

## Приоритет
P0

## Скрин-улика
`visual/before-*.png` → `visual/after-*.png` · guards.md

## Зона
Frontend
