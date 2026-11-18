### [C-08] Секции «Форматы / Атмосфера / FAQ» невидимы (reveal opacity 0)
- **Зона / Экран:** about.html ниже первого экрана
- **Факт (Playwright):** `.reveal` у `#formats`, `#atmosphere`, `#faq` — `opacity: 0`, класс `reveal-visible` отсутствует, пока не проскроллить. Full-page shot выглядит как огромная пустота.
- **Ожидание:** контент читаем без «пустого листа»; анимация не прячет блоки навсегда; IO с достаточным rootMargin или стартовая видимость секций.
- **Приоритет:** P0
- **Скрин-улика:** `memory/client-review/shots/about-1440.png`, `about-390.png`
- **Зона:** Frontend
