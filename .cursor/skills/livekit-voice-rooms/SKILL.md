---
name: livekit-voice-rooms
description: >-
  Router for Vernatun Lounge voice rooms: LiveKit SFU, React room UI, tokens,
  didactics, safety. Use for any voice-room / LiveKit / WebRTC lounge task.
---

# LiveKit Voice Rooms — роутер Vernatun Lounge

## Когда вызывать

Любая задача про голосовые комнаты, LiveKit, WebRTC SFU, сцену/зал, Scenario Deck, Shared Lexicon, Fair Speaking Meter, Trust Score, эксплуатацию медиа-ноды.

## Канон продукта

1. Прочитай `liverooms/ARCHITECTURE.md` и актуальный `liverooms/DEVELOPMENT_PLAN.md`.
2. Исследование конкурентов — `liverooms/Анализ конкурентов языковых комнат.md` (не переписывать экономику без нужды).
3. **Self-hosted LiveKit SFU** — default. Discord embed / HelloTalk / CPaaS (Twilio/Agora) как основа — **запрещены** без явной смены архитектуры Архитектором.
4. Аудио — канал; ценность — дидактика + академическая безопасность.

## Skill-first по зоне

| Зона | Скилл / роль |
|------|----------------|
| Spec + chain | `architect` + этот роутер |
| Токены, комнаты, webhooks, Trust Score | `backend` + `safe-db-migrations` + `voice-room-safety` |
| React room / lobby / `@livekit/components-react` | Frontend + `luxury-web-craft` + этот роутер; MCP **livekit-docs** |
| Mobile lounge UX | `responsive-mobile-web`, `mobile-touch-scroll` |
| STT / private coach / toxicity | `ai-bridge` + `voice-room-didactics` + `prompt-engineering` |
| SFU / TURN / Prometheus / runbook | Deployer + `webrtc-realtime-ops` |
| Приёмка | Клиент: `client-review` + mobile MCP; dual-peer audio руками |
| Docs LiveKit | MCP `livekit-docs` (`https://docs.livekit.io/mcp`) — prefer browse/docs_search |

## Типовые chain

- **Медиа-скелет:** Архитектор → Backend → Deployer → Frontend → Tester → Fixer → Client  
- **Дидактика:** Архитектор → Backend → Frontend → (Motion) → Tester → Fixer → Client  
- **AI:** Архитектор → AI Bridge → Backend → Frontend → Tester → Fixer → Client  

Не звать Flutter/WebGL «на всякий случай».

## Инварианты

- Mute-by-default на входе; после unmute — **несколько человек говорят одновременно**, все слышат всех (не Stage-очередь).
- Секреты LiveKit только на сервере; клиент получает короткий JWT.
- AI coach только приватно автору реплики.
- Нет дейтинг-UI (гео, пол, крупные фото, ЛС незнакомцам).
- Data-safety: не wipe session DB / memory без явного запроса пользователя.
- Playwright ≠ доказательство двустороннего аудио; нужен dual-peer guard.

## Выход роли

Кратко: что сделано относительно фазы плана; какие чекбоксы закрыть; нужен ли Клиент.
