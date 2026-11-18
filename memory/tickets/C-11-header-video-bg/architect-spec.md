# C-10 + C-11 — W-04

## C-10 Header CTA

Проблема: brand CSS `a { color: azure !important }` бьёт CTA, если `bg-terracotta` от Tailwind не сработал.
Фикс: класс `.site-cta` с явным `background:#C95B36; color:#fff !important` в inject CSS; убрать дубль «Расписание» справа (оставить только «Запись»).

## C-11 Video hero

- Скопировать `images/Фон хедера.mp4` → `images/header-bg.mp4` (не удалять оригинал).
- В `film-reel`: один `<video src="/images/header-bg.mp4" autoplay muted loop playsinline poster="/gallery/1.jpg">`.
- Убрать цикл img или оставить poster-only при reduced-motion.
- Усилить `.film-scrim`: темнее по центру (radial/linear), белый quote + белый film-mark.
- `object-fit: cover; object-position: center;` на video, full bleed min-height 100svh.

## Paths

`index.html`, `css/site.css`, `js/site.js`, `images/header-bg.mp4`
