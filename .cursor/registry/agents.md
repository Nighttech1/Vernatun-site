# Реестр команды агентов — Sputnik Life OS / Cortana

## Базовая команда

| Роль | Правило | Скилл | MCP / плагины |
|------|---------|-------|----------------|
| Клиент | `client.mdc` | `client-review` (+ `mobile-qa`), `web-visual-critic`, `ticket-engine`, `taste-skill`, `a11y-mobile-qa`; чеклисты `responsive-mobile-web`, `mobile-touch-scroll` | `playwright`, **`playwright-iphone`**, **`playwright-android`**, `chrome-devtools-mobile`, Image Diff, A11y, Lighthouse · `plugins/client` |
| Оркестратор | `orchestrator.mdc` | реестр + team-org | |
| Архитектор | `architect.mdc` | `architect`; LLM → `prompt-engineering`; RAG → `rag-stack`; Cortana retrieval → **`cortana-retrieval`** | `plugins/architect` |
| Фронтендер | `frontend.mdc` | **A:** `image-to-luxury-ui`, `luxury-web-craft`, `create-design-md`, `design-token-guardian`, **`responsive-mobile-web`**, **`mobile-touch-scroll`**; Lounge → **`livekit-voice-rooms`**, `voice-room-didactics` · **B:** `flutter-motion-engine`, `flutter-dense-datagrid` | `plugins/frontend` + mobile Playwright MCP + **`livekit-docs`** |
| Motion | `motion.mdc` | `web-motion-engine`, **`mobile-touch-scroll`**, `emil-animate`, `review-animations`, `web-perf-motion` | `plugins/motion` + `playwright-iphone` / `playwright-android` |
| WebGL | chain only | `three-webgl-craft` | |
| Бекендер | `backend.mdc` | `backend`, `safe-db-migrations`, `pydantic-v2`, `pgvector-semantic-search`; Cortana index upsert → `cortana-retrieval` | sqlite RO, postgres; `plugins/backend` |
| AI Bridge (Cortana) | `ai-bridge.mdc` | `ai-bridge`, **`cortana-stack`**, **`cortana-retrieval`**, `sputnik-data-schema`, `prompt-engineering`, `rag-stack`, LangGraph HITL | `plugins/ai-bridge` |
| Кодер | `coder.mdc` | `coder`; graphs → LangGraph skills; Cortana context → `cortana-retrieval` | маршрутизатор |
| Тестировщик | `tester.mdc` | `tester` + **`cortana-retrieval-guards`** | Lighthouse, anti_slop_scan, sqlite RO |
| Фиксер | `fixer.mdc` | `fixer` | `plugins/fixer` |
| Деплоер | `deployer.mdc` | `deployer` + при Lounge: **`webrtc-realtime-ops`** | VPS gate после Клиента; LiveKit/TURN volumes |
| **Realtime** (Lounge) | `realtime.mdc` | **`livekit-voice-rooms`**, **`webrtc-realtime-ops`** | MCP **`livekit-docs`**; `plugins/realtime` |

## Профиль Vernatun Lounge (голосовые комнаты)

| Задача | Chain | Скиллы |
|--------|-------|--------|
| SFU + TURN + token API + пустая комната | Архитектор → Backend → **Realtime**/Deployer → Frontend → Tester → Fixer → Клиент | `livekit-voice-rooms`, `webrtc-realtime-ops`, `backend` |
| Сцена/зал + лобби mobile | Архитектор → Frontend → Motion → Tester → Fixer → Клиент | `livekit-voice-rooms`, `responsive-mobile-web`, `mobile-touch-scroll` |
| Scenario / Lexicon / Fair Meter | Архитектор → Backend → Frontend → Tester → Fixer → Клиент | `voice-room-didactics` |
| Trust Score / антидейтинг / mute | Архитектор → Backend → Frontend → Клиент | `voice-room-safety` |
| Private AI coach + toxicity | Архитектор → AI Bridge → Backend → Frontend → Tester → Клиент | `voice-room-didactics`, `ai-bridge`, `prompt-engineering` |

Канон: `liverooms/ARCHITECTURE.md`. План: `liverooms/DEVELOPMENT_PLAN.md`.  
Запрет основы: Discord embed, HelloTalk/Tandem SDK, Twilio/Agora как primary CPaaS.

## Профили Frontend

| Задача | Стек | Агенты в chain |
|--------|------|----------------|
| Одна картинка → premium UI + люкс-анимации | Next/React + GSAP/Lenis | Frontend (A) → **Motion** → Клиент |
| **Мобильный адаптив premium landing** | тот же web-стек | Архитектор → Frontend (A) + **Motion** (`responsive-mobile-web` + `mobile-touch-scroll`) → Тестировщик → Фиксер → Деплоер → **Клиент** (`mobile-qa`, iPhone+Android MCP) |
| Life OS таблицы, sync, offline | Flutter | Frontend (B) |

**Flutter не тянет luxury scroll/motion уровня Lusion/Active Theory.** Для premium visual — web-стек.

## RAG / Cortana stack

| Пакет | Роли |
|-------|------|
| `cortana-stack` | AI Bridge (маршрутизатор Cortana: TG, GCal, HITL) |
| **`cortana-retrieval`** | AI Bridge + Архитектор + Backend (filter-first → sufficiency → entity vector) |
| `sputnik-data-schema` | AI Bridge (канон целей) |
| LangGraph HITL | AI Bridge |
| chroma-local | AI Bridge — **entity collection** отдельно от dialog `cortana_rag/` |
| pgvector-semantic-search | Backend (альтернатива индекса по spec Архитектора) |

### Типовой chain — Cortana Retrieval (ТЗ шаги 5–9)

`Архитектор → AI Bridge → Backend (sync upsert индекса) → Тестировщик → Фиксер → Деплоер → Клиент`

Frontend / Motion / WebGL — **не** подключать. GraphRAG — не default.

## MCP

playwright (1440), **playwright-iphone** (iPhone 15), **playwright-android** (Pixel 7), chrome-devtools, **chrome-devtools-mobile** (393), image-compare, a11y, lighthouse, **livekit-docs** (`https://docs.livekit.io/mcp`).  
(sqlite/postgres — только если в проекте есть БД; у Vernatun landing — нет. Session DB Lounge — по spec Backend.)

## Не включены (и когда добавить)

| Пробел | Когда закрывать |
|--------|-----------------|
| Geo-аналитик / Mapbox | epic «карта диаспоры», не Lounge V1 |
| Pinecone | если Архитектор выберет managed vector вместо Chroma/pgvector |
| Отдельный Retrieval Engineer | зона AI Bridge |
| Runtime LiveKit ops MCP (list rooms / kick) | после стабильного SFU — обертка над RoomService API (сейчас docs MCP + CLI/health script) |
| `playwright-e2e` skill | первая автоматизация лобби |
| `forms-mail` | заявки на лендинге вне комнат |
