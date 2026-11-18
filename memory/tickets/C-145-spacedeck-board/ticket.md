### [C-145] Реальная онлайн-доска Spacedeck Open вместо мокапа

- **Зона / Экран:** Комната → центр (сейчас `BoardPanel` stub)
- **Факт:** В эфире «доска» — статичный мокап фраз (`boardDemo`), участники не видят общую живую доску и не могут кидать PDF/картинки вместе.
- **Ожидание:** В центре комнаты — **Spacedeck Open** (self-host): все в комнате видят одну Space; загрузка PDF/картинок работает. Мокап убрать.
- **Источник OSS:** https://github.com/spacedeck/spacedeck-open (AGPL-3.0); Docker: `spacedeck/spacedeck-open`; локально порт обычно **9666**.
- **Хранение (вопрос владельца):** ответить в spec/README — где PDF на VPS, когда удаляются (сейчас у Spacedeck по умолчанию **без авто-удаления** → нужна политика Vernatun).
- **Приоритет:** P0
- **Скрин-улика:** мокап toolbar `✎ □ T` / scenario board на `/room`
- **Зона:** Backend + Deployer + Frontend (+ Realtime infra)
