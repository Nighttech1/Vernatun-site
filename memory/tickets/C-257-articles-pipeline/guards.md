# C-257 guards

1. `node scripts/articles/build.mjs` собирает все `published` статьи в `articles/<slug>.html`.
2. Идемпотентность: повторная сборка не меняет выход (sha до/после совпадает). PASS.
3. Правки только между маркерами в `articles.html` / `js/site.js` / `public/sitemap.xml`.
4. 3 перенесённые статьи рендерятся визуально эквивалентно оригиналу (eyebrow «Статья», h1, лид, тело, «Все статьи»).
5. No-mojibake scan по сгенерированным файлам — пусто. PASS.
6. `anti_slop_scan` на `articles/` — OK.
7. Шаблон содержит canonical + meta description + og + JSON-LD Article.

Нормализация (осознанная): inline-ссылки приведены к единому стилю `decoration-sungold/70 underline-offset-4`
(в старом `kak-prohodit-vstrecha` было `/60 offset-2`). Внешние ссылки получают target=_blank rel=noopener.
Inline-code (`` `...` ``) не в белом списке — рендерится буквально; задокументировано в `content/README.md`.
