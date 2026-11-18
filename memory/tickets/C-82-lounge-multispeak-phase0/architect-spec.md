# Architect-spec — W-32 / C-82–C-84

## Продуктовое решение (обязательно)

**Модель комнаты = Discord Voice / TeamSpeak, не Discord Stage.**

- В одной комнате **несколько участников одновременно** публикуют аудио (`canPublish`).
- SFU пересылает треки: **каждый слышит всех** говорящих (full duplex / multi-party).
- Mute по умолчанию при входе — антиспам; после unmute пользователь говорит **параллельно** с другими.
- Host может mute/kick, но **нет** очереди «только один на сцене» как обязательной модели.
- Опциональный режим «учебная сцена» (рука → promote) — **P2 later**, не блокирует V1 открытых комнат.

## Фаза 0 — решения

| Решение | Значение |
|---------|----------|
| ARCHITECTURE | утверждена с multi-speak |
| URL раздела | путь **`/lounge`** на основном домене (SPA позже); лендинг — ссылка |
| Медиа-нода сейчас | **localhost Docker** (`liverooms/infra/`) |
| Медиа-нода prod | существующий VPS Vernatun **только после** Клиента + явного «да» |
| CEFR на запуск | `open`, `A1`, `B1`, `slang` (каталог позже в фазе 2) |
| MCP/skills | уже в реестре (`livekit-docs`, Realtime) |
| Юридическое | stub `liverooms/ROOM_RULES.md` (без AI-записи голоса до фазы 6) |

## Фаза 1 — инфра

- LiveKit Server Docker + dev keys в `.env` gitignored.
- coturn в том же compose (dev).
- Минимальная meet-страница для dual-peer smoke.
- Health: `plugins/realtime/livekit_health_check.py`.

## Вне scope волны

React Lounge бренд-UI, token API backend, VPS prod, AI coach.

## Acceptance Клиента

1. Текст архитектуры про одновременную речь — да.
2. `docker compose up` поднимает SFU; health ok.
3. Есть инструкция: два браузера → одна комната → оба unmute → слышат друг друга.
