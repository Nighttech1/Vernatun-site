### [C-07] Весь текст чёрный, не azure продакшена
- **Зона / Экран:** весь сайт (body, h1–h3, nav, footer)
- **Факт (Playwright computed):** `h1`, `body`, `footer a`, `nav a` = `rgb(0, 0, 0)`. Tailwind CDN/preflight перебивает `css/site.css`.
- **Ожидание:** основной текст `#2A5A84` (azure) как в проде — шапка, футер, заголовки, абзацы.
- **Приоритет:** P0
- **Скрин-улика:** `memory/client-review/shots/about-1440.png`, probe 2026-09-09
- **Зона:** Frontend
