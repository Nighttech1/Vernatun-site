# C-257 architect-spec

## Goal
Детерминированный статический генератор статей: один источник `content/articles/*.md`
→ `articles/<slug>.html` + обновление списка/навигации/sitemap. Без нового runtime,
без зависимостей npm.

## In scope
- `scripts/articles/build.mjs` — сборка.
- `scripts/articles/lib.mjs` — парсер front-matter + безопасный Markdown-сабсет + шаблон.
- Маркеры-регионы в `articles.html`, `js/site.js`, `public/sitemap.xml`.

## Out of scope
- CLI команды агента (C-258), миграция контента (C-259), расписание, внешний репозиторий.

## Layers / contracts
- **Источник:** каталог Markdown. Путь = `ARTICLES_SRC` env или дефолт `content/articles`.
  Это точка подключения внешнего GitHub-репо статей позже (клон/submodule → `ARTICLES_SRC`).
- **Front-matter (YAML-сабсет):** `slug,title,category,description,lead,date,status,author`.
- **Статусы:** `build` рендерит только `status: published`; `preview` — ещё `draft/review`.
- **Шаблон статьи** 1:1 с текущим `articles/esli-stesnyaeshsya.html`: head (canonical/description/
  og/JSON-LD Article), `#site-header` + `/js/site.js`, `<article>` eyebrow=category + h1 + lead +
  тело + «Все статьи», `#site-footer`, `VernatunChrome.mountRest()`.
- **Markdown-сабсет (белый список):** абзацы, `**bold**`, `[text](url)`, `## подзаголовок`,
  списки `- `. Любой сырой HTML/`<script>` экранируется. Выход — UTF-8 без BOM.
- **Маркеры:** список в `articles.html` `<!-- ARTICLES:START -->…<!-- ARTICLES:END -->`;
  навигация в `site.js` `/* ARTICLES:START */…/* ARTICLES:END */`; sitemap
  `<!-- ARTICLES:START -->…<!-- ARTICLES:END -->`. Генератор меняет только между маркерами.

## AC
- Пересборка с нуля даёт побайтово-стабильный выход (идемпотентность).
- 3 существующие статьи переносятся в источник и рендерятся визуально эквивалентно.
- Нет mojibake; `anti_slop_scan` зелёный; clean URL совместим (`articles/<slug>.html`).

## Risks
- Хрупкое редактирование `site.js` → решено маркерами, без слепых регулярок по всему файлу.
- Инъекции в контенте → белый список Markdown + экранирование.
