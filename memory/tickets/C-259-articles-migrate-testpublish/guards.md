# C-259 guards

1. 3 статьи перенесены в `content/articles/*.md` (status: published), текст 1:1 с оригиналом.
2. Тестовый черновик `test-kontrakt-agenta` проведён: new → (edit) → validate → publish → build. PASS.
3. Локальный сервер `dev_server.py`: `GET /articles` список из 4 статей; `GET /articles/test-kontrakt-agenta` → HTTP 200, верный `<title>`. Чистые URL работают.
4. Визуал (скрины MCP): список desktop, страница статьи desktop + mobile 375 — на бренде, одна колонка, без горизонтального скролла.
5. Навигация (site.js) и sitemap содержат все 4 статьи.
6. **VPS-деплой НЕ выполнялся** — ждёт вердикта Клиента + явного «да» пользователя + внешнего репо статей.
