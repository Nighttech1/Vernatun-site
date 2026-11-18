# Глаза Клиента — MCP (сайты Vernatun)

Конфиг: `.cursor\mcp.json`. Node: `E:\Applications\Tools\node`.

| Сервер | Viewport / device | Зачем |
|--------|-------------------|--------|
| `playwright` | **1440×900** | desktop клики, screenshot, vision |
| `playwright-iphone` | **iPhone 15** | вёрстка + touch scroll |
| `playwright-android` | **Pixel 7** | вёрстка + touch scroll |
| `chrome-devtools` | desktop | bounding box, styles, сеть, perf |
| `chrome-devtools-mobile` | **393×852** | mobile emulate + lighthouse a11y |
| `image-compare` | — | before/after, красная diff-маска |
| `a11y` | — | контраст WCAG AA |
| `lighthouse` | mobile metrics | LCP, CLS, INP, TBT |

Имена в Cursor могут быть с префиксом `user-` / `project-0-Vernatun-`.

## Ритуал

1. Localhost жив (URL из спеки / Deployer).
2. Desktop: `playwright` 1440×900. Mobile: **оба** `playwright-iphone` и `playwright-android`.
3. Подожди шрифты / Lenis / анимации (не скелетон).
4. Скролл: hero, mid, footer — **пальцем** на mobile MCP (несколько фликов).
5. Контраст текста на фото/видео — отдельно.
6. Тикеты через ticket-engine. После фикса — `compare_images` + lighthouse повторно.
7. Mobile hard-reject: `client-review/mobile-qa.md`.

Курсор/часы на diff — ложное срабатывание. Сдвиг сетки — нет.
