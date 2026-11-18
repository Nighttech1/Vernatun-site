# W-72 — Автопубликация статей Claude-агентами

**before_sha:** 5e46b22
**Дата:** 2026-10-31
**Профиль:** статический сайт Vernatun (не Lounge).

## Тикеты волны (P1)

| Тикет | Суть | Путь |
|-------|------|------|
| C-257 | Движок пайплайна статей (генератор + шаблон + список/sitemap/навигация по маркерам) | `scripts/articles/`, `articles/`, `articles.html`, `js/site.js`, `public/sitemap.xml` |
| C-258 | Контракт публикации для агентов (схема контента + CLI new/validate/publish/list) | `scripts/articles/cli.mjs`, `content/README.md` |
| C-259 | Миграция 3 статей в `content/` + тестовый черновик + локальная тест-выкладка + guards | `content/articles/`, guards |

## Непересекающиеся пути

- C-257 → `scripts/articles/build.mjs`, маркеры в `articles.html` / `site.js` / `sitemap.xml`.
- C-258 → `scripts/articles/cli.mjs`, `content/README.md`, схема.
- C-259 → `content/articles/*.md` (данные), прогон генератора.

C-257 и C-258 делит один каталог `scripts/articles/`, но разные файлы — не параллелим наугад, порядок: C-257 → C-258 → C-259.

## Гейты

- Localhost (`scripts/dev_server.py`, :8080) — для приёмки Клиента.
- VPS/prod (155.212.187.181 / vernatunspeakclub.com) — **только** после вердикта Клиента без P0/P1 **и** явного «да» пользователя. Плюс открытый вход: GitHub-репозиторий статей (внешний источник) — пользователь передаёт отдельно.

## Откат

- `before_sha = 5e46b22`. Сгенерированные артефакты не коммитим до апрува; откат = `git checkout -- <paths>`.
- В рабочем дереве есть пред-существующие несвязанные правки (`.cursor/*`, skills) — волна их НЕ трогает и НЕ коммитит.
