# Где усилить команду (дорогие сайты + голосовые комнаты)

Слабые места — не «ещё один оркестратор», а узкие скиллы. Добавлять по мере первого реального проекта.

## Закрыто для Vernatun Lounge (2026-03)

| Агент | Добавлено | Зачем |
|-------|-----------|-------|
| **Realtime** (новая роль) | `realtime.mdc`, `webrtc-realtime-ops`, `plugins/realtime` | SFU / TURN / инциденты медиа |
| **Все зоны Lounge** | `livekit-voice-rooms` | единый роутер |
| **Backend / Клиент** | `voice-room-safety` | Trust Score, антидейтинг, сцена/зал |
| **AI Bridge / Frontend** | `voice-room-didactics` | Scenario, Lexicon→SRS, Fair Meter, private coach |
| **Команда** | MCP `livekit-docs` | актуальные docs/SDK LiveKit |
| **Deployer / Tester** | `livekit_health_check.py` | smoke ноды |

Канон: `liverooms/ARCHITECTURE.md`, план: `liverooms/DEVELOPMENT_PLAN.md`, реестр: `.cursor/registry/agents.md`.

## Ещё открыто (сайт / общее)

| Агент | Чего не хватает | Зачем | Скилл (имя) |
|-------|-----------------|-------|-------------|
| **Фронтендер** | Сбор и выдача ассетов | AVIF/WebP, video poster, blurhash | `asset-pipeline` |
| **Motion** | Звук / haptics | редкий люкс — не ставить без спеки | `sound-motion` (позже) |
| **Клиент** | A11y глубже | focus trap, skip-link на сценах комнаты | `a11y-critic` |
| **Клиент / Тестер** | SEO | title/OG раздела `/lounge` | `seo-qa` |
| **Тестировщик** | Playwright как код | e2e лобби (не медиа-пиры) | `playwright-e2e` |
| **Бекендер** | Формы сайта | заявки лендинга | `forms-mail` |
| **AI Bridge** | Охрана промпта | jailbreak / PII в coach | `prompt-safety` |
| **Деплоер** | Preview-среды | URL для Клиента до prod | `preview-deploys` |
| **Realtime** | Runtime ops MCP | list/kick rooms из агента | после стабильного SFU — тонкая обёртка RoomService |
| **Realtime** | Нагрузочный прогон | N×M участников | после пилота цифр |

## Когда команда «полностью готова» к голосовым комнатам

См. шкалу готовности в ответе Оркестратора / `liverooms/ARCHITECTURE.md` § готовности команды.

Кратко:

1. **Готова проектировать и вести волны сейчас** — после этого усиления (skills + MCP + роль Realtime + архитектура/план).
2. **Готова к пилоту с пользователями** — закрыты фазы 0–5 плана + зелёный Клиент.
3. **Готова ко всем сценариям эксплуатации** — плюс runtime ops MCP, алерты, dual-peer CI-привычка, AI opt-out, runbook ротации ключей (фаза 7 + хвост открытых скиллов выше).

Не добавлять FinGrad-домен и Flutter-кабинет как обязательные роли для Lounge.
