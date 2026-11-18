# C-259 — Миграция статей + тестовая выкладка

- **P:** P1
- **area:** articles / content + release
- **Волна:** W-72

## Мотивация
Перевести 3 существующие статьи на единый источник и прогнать контракт end-to-end:
агент-подобный черновик → preview → publish → build → локальная выкладка.

## Expected
- `content/articles/{esli-stesnyaeshsya,kak-prohodit-vstrecha,kakoi-armyanskii}.md` (published).
- 1 тестовый черновик, проведённый через publish → build.
- Локальный прогон на `scripts/dev_server.py` (:8080): `/articles` и `/articles/<slug>` открываются.
- **VPS-деплой НЕ выполняется** до «да» пользователя.

## Actual (после волны)
Контент перенесён, тестовая статья прошла весь контракт локально, guards зелёные.
