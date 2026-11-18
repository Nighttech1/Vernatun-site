# C-257 chain

1. [ ] **Backend** — `scripts/articles/lib.mjs`: front-matter parser + Markdown-сабсет + escape + шаблон статьи.
2. [ ] **Backend** — `scripts/articles/build.mjs`: читает источник, рендерит страницы, обновляет маркеры в `articles.html`/`site.js`/`sitemap.xml`, режимы build/preview.
3. [ ] **Backend** — вставить маркеры-регионы в `articles.html`, `js/site.js`, `public/sitemap.xml` (одноразово, безопасно).
4. [ ] **Tester** — идемпотентность, anti-slop, визуальная эквивалентность 3 статей, no-mojibake.
5. [ ] **Fixer** — до зелёного.

Overlapping paths: шаги 1–3 последовательны (один автор), не параллелить.
