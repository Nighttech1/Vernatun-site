# План разработки голосовых комнат «Вернатун Lounge»

Опирается на [`ARCHITECTURE.md`](./ARCHITECTURE.md).  
Отмечайте чекбоксы по мере выполнения. **Код не писать**, пока Архитектор не выложит `architect-spec.md` + `chain.md` на конкретную волну.

Легенда приоритета: **P0** блокер запуска · **P1** нужен для учебного MVP · **P2** усиливает удержание / AI.

---

## Фаза 0 — Согласование и подготовка команды

- [x] **P0** Утвердить [`ARCHITECTURE.md`](./ARCHITECTURE.md) (LiveKit self-hosted, без Discord/CPaaS как основы; **multi-party одновременная речь**)
- [x] **P0** Выбрать хостинг медиа-ноды: **localhost Docker сейчас** (`liverooms/infra/`); prod VPS — после вердикта Клиента
- [x] **P0** Зафиксировать URL раздела: путь **`/campus`** на основном домене (legacy `/lounge` → redirect); лендинг — ссылка
- [x] **P0** Подключить MCP `livekit-docs` и скиллы realtime в реестре агентов (см. усиление команды)
- [x] **P1** Минимальный CEFR-набор на запуск: `open` / `A1` / `B1` / `slang`
- [x] **P1** Юридический минимум: stub [`ROOM_RULES.md`](./ROOM_RULES.md) (AI-согласие — к фазе 6)

---

## Фаза 1 — Инфраструктура LiveKit (медиа-скелет)

- [x] **P0** Развернуть LiveKit Server (Docker) на localhost (`liverooms/infra/`); порты по compose
- [x] **P0** Настроить API key/secret; хранить только в `.env` (не в git) — локально `--dev`: `devkey`/`secret`
- [x] **P0** Поднять **TURN/coturn** в compose (dev); LTE-проверка — на VPS позже
- [x] **P0** Healthcheck: script / API без ошибок (`ok: true` на :7880)
- [x] **P1** Prometheus scrape метрик LiveKit + простой алерт «SFU down» — W-48 Prometheus + Owner Inbox (W-47)
- [x] **P1** Webhook URL на наш backend (заглушка) — W-48 `livekit.yaml` → lounge_api
- [x] **P2** Дашборд мониторинга комнат (livekit-monitor или Grafana) — W-49 Grafana profile `metrics`

**Критерий выхода фазы 1:** два браузера слышат друг друга **и могут говорить одновременно** в тестовой комнате через наш SFU.  
**Инфра готова; dual-peer подтверждён Клиентом (2026-09-20).** Продакшен: https://vernatunspeakclub.com/test-room

---

## Фаза 2 — Backend: каталог, доступ, токены

- [x] **P0** Модель данных: Room seed `rooms.json` (+ online из LiveKit); Session/TrustScore — позже
- [x] **P0** `GET/POST …/token?room=` — выдача LiveKit JWT + ахперик N
- [x] **P0** Роли в токене: member с `canPublish`+`canSubscribe`; mic off в UI до жеста; **несколько publish сразу**
- [x] **P0** `GET` каталога комнат (язык/уровень/online)
- [x] **P1** Создание комнаты host’ом + пароль для «договорённых» комнат — W-47
- [x] **P1** Приём webhooks LiveKit → append-only log (без удаления)
- [x] **P1** Academic Trust Score: чтение порога на вход в B2/C1
- [x] **P2** Админ-API: mute/kick audit log — W-49 `GET /admin/moderation` + вкладка Owner Inbox

**Критерий выхода фазы 2:** без валидного токена клиент в комнату не попадает; с токеном — подключается к SFU.  
**Лобби:** https://vernatunspeakclub.com/lounge

---

## Фаза 3 — Frontend Lounge (React-клиент)

> **Промежуточный MVP (W-35/W-36, static HTML):** `/lounge` + `/room?room=` с multi-speak, share link и чатом до опустошения комнаты — **принято Клиентом**. Ниже — целевой React SPA.

- [x] **P0** Каркас SPA `/lounge` в бренде Вернатун (не generic purple SaaS) — W-37 `liverooms/web/`
- [x] **P0** Лобби: список комнат, фильтр по языку/уровню, CTA «Войти» — W-37 React
- [x] **P0** Room shell: `@livekit/components-react`, `<RoomAudioRenderer />`, reconnect — W-37
- [x] **P0** Multi-party UI: список участников, mute/unmute **без** обязательной «руки»; видны кто говорит — W-37
- [x] **P0** Запрос микрофона только по жесту пользователя — W-37
- [x] **P1** Адаптив iPhone 15 / Pixel 7: одна колонка, без горизонтального скролла, safe-area — W-37 (базовый; полировка позже)
- [x] **P1** Состояния: connecting / reconnecting / kicked / room ended — W-44
- [x] **P1** Ссылка с текущего static-сайта на Lounge — W-45 (nav «Кампус» → `/lounge` static)
- [x] **P2** Лёгкий motion для meter/лексики (без jank на слабых телефонах) — W-49 CSS/WAAPI scaleX + enter

**Критерий выхода фазы 3:** happy-path «лобби → unmute → несколько человек говорят и слышат друг друга» на desktop и mobile.  
**W-37:** React SPA на localhost готов к приёмке; dual-peer audio — руками Клиента.

---

## Фаза 4 — Дидактика V1 (без тяжёлого AI)

- [x] **P1** Scenario Deck: загрузка сценария CEFR, общая доска, таймер реплики — W-43 (демо-сценарии по roomId + sync таймер)
- [x] **P1** Shared Room Lexicon: клик → карточка у всех (DataChannel или API poll) — W-43 DataChannel
- [x] **P1** Кнопка «В мой SRS» → запись в профиль/словарь пользователя — W-43 localStorage stub
- [x] **P1** Fair Speaking Meter по speaking/VAD events LiveKit — W-43
- [x] **P2** Персональные подсказки конструкций на карточках спикера — W-46
- [x] **P2** Шаблоны сценариев: дебаты / таможня / собеседование / лексическая игра — W-46

**Критерий выхода фазы 4:** комната ощущается учебным тренажёром, а не пустым голосовым чатом.

---

## Фаза 5 — Безопасность среды

- [x] **P0** Профиль без гео/пола/крупных дейтинг-фото в UI Lounge — W-44 (initials only + copy)
- [x] **P0** Запрет ЛС «незнакомец ↔ незнакомец» внутри Lounge V1 — W-44 (общий чат only)
- [x] **P0** Mute-by-default + host mute/kick (речь остаётся multi-party) — W-44 (API в `lounge_api.py`; live host после выкладки API)
- [x] **P1** Жалоба → снижение Trust Score / временный бан комнат — W-45 MVP (trust.json + report; gate B1+)
- [x] **P1** Авто-mute по серверным маркерам токсичности (если AI-пайплайн готов) или ручной escalate — W-46 host escalate stub
- [x] **P1** Кабинет владельца (пароль): жалобы из комнат + алерты SFU — W-47 `liverooms/admin/` (домен позже; **без Telegram HITL**)

**Критерий выхода фазы 5:** воспроизведённые антипаттерны HelloTalk/Tandem закрыты продуктово.

---

## Фаза 6 — AI-контур (после стабильного аудио)

- [x] **P2** Поток аудио/текста реплики в STT (через DataChannel или server egress — по spec) — W-50 text-first MVP
- [x] **P2** Private coach: разбор только автору реплики — W-50
- [x] **P2** Фиксация слов-паразитов / естественных альтернатив — W-50
- [x] **P2** Toxicity classifier → событие модерации — W-50 stub (без auto-kick)
- [x] **P2** Согласие пользователя на AI-разбор; opt-out — W-50

**Критерий выхода фазы 6:** AI не ломает SFU при падении LLM; комната работает без AI (graceful degrade).  
**W-50:** localhost MVP готов к приёмке Клиента (запись эфира / Whisper LLM — L2).

---

## Фаза 7 — Тесты, приёмка, эксплуатация

- [x] **P0** Dual-peer ручной чеклист (2 браузера / телефон+ПК) в `guards` — W-45 `C-120-dual-peer-checklist-a11y/guards.md`
- [x] **P0** Регресс: токен expired, kick, host disconnect, TURN-only сеть — W-46 `liverooms/REGRESSION.md`
- [x] **P1** Playwright: лобби, гейты UI (не замена медиа e2e) — W-46 `npm run test:lobby`
- [x] **P1** Lighthouse / a11y на лобби; mic buttons с aria — W-45 aria + W-48 Lighthouse
- [ ] **P0** Вердикт **Клиента** desktop 1440 + mobile без P0/P1
- [ ] **P0** Явное согласование prod-деплоя
- [x] **P1** Runbook: рестарт LiveKit, ротация ключей, backup конфигов (не wipe данных сессий) — W-46 `liverooms/RUNBOOK.md`
- [x] **P1** Алерты: SFU down → Owner Inbox (W-47); ICE / диск webhook → Inbox (W-48)
- [x] **P2** Нагрузочный ориентир: N комнат × M слушателей (зафиксировать цифры после пилота) — W-49 [`LOAD_CAPACITY.md`](./LOAD_CAPACITY.md)

---

## Рекомендуемые волны (без лимита 3 тикета; дробить по смыслу при большой очереди)

| Волна | Фокус | Chain (кратко) |
|-------|--------|----------------|
| W1 | LiveKit up + token API + пустая комната | Архитектор → Backend → Deployer → Frontend → Tester → Fixer → Client |
| W2 | Сцена/зал + лобби + mobile | Архитектор → Frontend → Motion → Tester → Fixer → Client |
| W3 | Scenario + Lexicon + Fair Meter | Архитектор → Backend → Frontend → Tester → Fixer → Client |
| W4 | Trust Score + антидейтинг UX | Архитектор → Backend → Frontend → Client |
| W5 | AI coach + toxicity | Архитектор → AI Bridge → Backend → Frontend → Tester → Client |

---

## Что считается «готово к пользователям»

Минимум для мягкого запуска (закрыты фазы **0–5** без полного AI):

1. Self-hosted LiveKit + TURN работают.  
2. Наш домен, наш лобби, наши токены.  
3. Сцена/зал и учебные поверхности V1.  
4. Защита от токсичного/дейтинг-сценария.  
5. Приёмка Клиента без открытых P0/P1.

Фаза **6** может идти параллельно после стабилизации W1–W3.

---

**Готов продолжить** — следующая команда пользователя: утвердить архитектуру или запустить волну W1 (spec + chain).
