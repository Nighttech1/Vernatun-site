# Усиление команды Vernatun — 19.11.2026

## Результат и границы

В репозиторий включены 5 официальных skills с полными зависимыми reference/example/helper файлами и лицензиями; точки входа AGENTS.md и CLAUDE.md; профиль Cursor; правила качества и пошаговый план.
Усиление относится к процессу разработки. Сайт не получил новый дизайн в рамках этой задачи; приёмка production не выполнялась.
MCP-конфигурации подготовлены, но серверы в среде исполнителя не запущены. В просмотренном дереве .cursor/mcp.json отсутствовал; старые карточки плагинов не подтверждают доступность серверов.

## Видео как ориентир

Изучен приложенный ролик document_5474143111053615306.mp4, длительность 10.58 s, последовательность кадров через 1 s.
Видны красная пространственная сцена, световые линии, слои объектов, крупная типографика и переходы между сценами/разделами. Это запись экрана, по которой нельзя достоверно определить библиотеку, FPS, вес страницы или качество mobile.
Для Вернатуна переносим принципы: сильный первый экран, ощущение места и сообщества, смысловой переход к встречам, единая хореография. Бренд, RU/HY и лёгкий доступ к записи сохраняют приоритет.
Конкретные сценарии и критерии описаны в WEB_DEVELOPMENT_PLAN.md.

## Что уже было и что добавлено

| Зона | Уже было | Усиление |
|---|---|---|
| Арт-дирекция | taste-skill, luxury-web-craft, brand, design-system | официальный frontend-design от Anthropic; сначала план и критика, затем UI |
| Motion/3D | web-motion-engine, emil-animate, three-webgl-craft | сохраняем; добавлены storyboard, mobile/reduced-motion и измеримые критерии |
| Тестирование | TypeScript Playwright test:lobby, только Desktop Chrome в config | официальный webapp-testing + план mobile/trace; действующий стек не дублируем Python-тестами |
| A11y | короткие mobile/a11y чеклисты | официальный a11y-debugging с reference snippets; ручной focus/modal/keyboard review |
| Скорость | web-perf-motion | официальные chrome-devtools и debug-optimize-lcp с диагностикой waterfall и LCP |
| Ассеты/SEO/preview | открытые пункты TEAM_STRENGTH | проектные процедуры и критерии; реализация preview-сервера ещё открыта |
| Контекст агентов | Sputnik/Cortana упоминается как профиль по умолчанию | AGENTS/CLAUDE + alwaysApply Vernatun профиль и явная маршрутизация |
| Инструменты | карточки заявляют MCP без конфигурации в дереве | проверяемые источники и versioned mcp.example.json; runtime статус указан отдельно |

## Источники

- Anthropic: https://github.com/anthropics/skills — frontend-design, webapp-testing.
- Google: https://github.com/ChromeDevTools/chrome-devtools-mcp — chrome-devtools, a11y-debugging, debug-optimize-lcp и MCP 1.13.0.
- Microsoft: https://github.com/microsoft/playwright-mcp — MCP 0.0.86.
- Hugging Face: https://github.com/huggingface/skills — изучен каталог; hf-cli, модели и датасеты отложены до задачи AI Bridge.
- Дополнительные кандидаты: https://github.com/dequelabs/axe-core и https://github.com/GoogleChrome/lighthouse; в этой волне зависимости не установлены.

Полные source commit SHA: plugins/web-team/sources.lock.json. Пять skills скопированы без изменений, лицензии сохранены.
Не устанавливаем ещё один UI kit, GSAP/Three или AI SDK без задачи: для motion/3D инструкции уже есть, но наличие карточки не означает наличие npm dependency.

## Наблюдения по текущим файлам

- index.html использует runtime cdn.tailwindcss.com, preload video и autoplay video с preload=auto. Это кандидаты для измерений и оптимизации, а не доказанный LCP-регресс.
- liverooms/web/playwright.config.ts содержит один проект Desktop Chrome; trace выключен.
- .github/workflows/deploy.yml выполняет проверку статей и build, но не запускает test:lobby и визуальные/a11y проверки.
- push в main запускает VPS deployment даже для документации. Поэтому материалы усиления передаются отдельной веткой/PR.

## Готовность

Команда получила инструкции и материалы для следующей волны V1.
До заявления «готовы к релизу» нужны: MCP smoke в целевой среде, baseline скриншоты, зелёные необходимые проверки, dual-peer regression для Campus и независимая клиентская приёмка.
При отсутствии browser runtime нельзя закрывать визуальные тикеты по одному чтению HTML.

## Проверки пакета усиления

Проверены frontmatter всех 5 skills, наличие лицензий, относительные ссылки и Python syntax. Все 16 исходных файлов skills совпадают с Git blob SHA upstream побайтово. MCP JSON разобран и проверены фиксированные версии. Helper with_server.py прошёл --help и smoke: поднял локальный HTTP server, выполнил HTTP 200 проверку и остановил сервер.
Продуктовый build и browser tests не запускались: код сайта и зависимости не меняются. Живая визуальная приёмка и MCP handshake остаются pending.
