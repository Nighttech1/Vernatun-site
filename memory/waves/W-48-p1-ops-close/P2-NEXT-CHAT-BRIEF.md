# Задание для нового чата — фаза P2 (Vernatun Lounge / Кампус)

Скопируй блок ниже в **новый чат** проекта Vernatun.

```text
Прочитай docs/CLIENT_ORCHESTRATOR_CYCLE.md и .cursor/prompts/start-client-orchestrator-cycle.md.
Запусти цикл Клиент↔Оркестратор. Обязательно пиши, какой агент делает ход.

Контекст: фазы 0–5 и все P1 плана liverooms/DEVELOPMENT_PLAN.md закрыты (волны до W-48).
Owner Inbox: liverooms/admin/ (пароль LOUNGE_OWNER_PASSWORD). Telegram HITL не делать.
Prod-деплой и домен кабинета — только после моего явного «да».

Цель волны: закрыть P2 из DEVELOPMENT_PLAN (не трогать фазу 6 AI целиком — только то, что отмечено ниже как P2 UI/ops).

P2 к закрытию (по приоритету внутри волны):
1. Лёгкий motion для Fair Meter / лексики (без jank на слабых телефонах) — skill web-motion-engine / flutter не нужен; React + CSS/WAAPI.
2. Дашборд мониторинга комнат (livekit-monitor или простой Grafana поверх Prometheus profile metrics) — localhost.
3. Админ-API: mute/kick audit log (чтение moderation.log в Owner Inbox или отдельная вкладка кабинета).
4. Нагрузочный ориентир: зафиксировать цифры N комнат × M слушателей после пилота (дока + методика, не обязательно полный load-test).

Не брать в эту волну (отложить на отдельный чат «фаза 6 AI»):
- STT, private coach, слова-паразиты, toxicity classifier, AI consent.

Инварианты: multi-party, mute-by-default, data-safety (не wipe sputnik_data.db / memory_storage / inbox), VPS только после «да».

Старт: Клиент открывает C-* на эти P2 → Архитектор spec+chain → исполнители → Тестировщик → Деплоер localhost → Клиент.
```
