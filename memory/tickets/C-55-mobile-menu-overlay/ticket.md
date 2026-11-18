# C-55 — Mobile menu поверх hero без непрозрачной панели

- **Зона / Экран:** Главная, iPhone 15, бургер-меню на film-hero
- **Факт:** Ссылки меню (azure) лежат поверх видео и цитаты; фон parchment не читается / прозрачен из‑за `header.is-film { background: transparent }`
- **Ожидание:** Полноэкранная (или max-height) непрозрачная parchment-панель, контрастные ссылки, body scroll lock, safe-area
- **Приоритет:** P0
- **Скрин-улика:** `before.png` (baseline iphone15-menu-open)
- **Зона:** Frontend
