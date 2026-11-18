---
name: webrtc-realtime-ops
description: >-
  Operate self-hosted LiveKit SFU, TURN/coturn, ICE, Prometheus, webhooks,
  room capacity. Use for Deployer/Backend voice-room infrastructure and incidents.
---

# WebRTC / LiveKit Realtime Ops

## Scope

Развёртывание и эксплуатация **self-hosted LiveKit** для Vernatun Lounge. Не путать с LiveKit Cloud billing как целевой моделью (Cloud допустим только как временный пилот по spec).

## Обязательный порядок

1. Прочитай `liverooms/ARCHITECTURE.md` §8 (ёмкость) и фазу 1 `DEVELOPMENT_PLAN.md`.
2. MCP **livekit-docs** — актуальные порты, config, CLI; не выдумывай флаги из памяти.
3. Секреты: `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, TURN credentials — только `.env` / secret store.
4. Data-safety: конфиги и session DB не удалять и не затирать пустым дампом без явного запроса.

## Чеклист ноды

- [ ] LiveKit Docker up; health API отвечает
- [ ] UDP media ports + TCP fallback по документации текущей версии
- [ ] coturn / TURN: тест с мобильного LTE
- [ ] Webhooks → backend URL с подписью
- [ ] Prometheus metrics + alert «process down»
- [ ] Ротация ключей в runbook; старый ключ отключить после выдачи нового
- [ ] Backup `livekit.yaml` / compose до изменений

## Инциденты (порядок)

1. Симптом: тишина / одностороний звук / «connecting…»  
2. Проверить SFU process → TURN → токен expiry → client consoles ICE  
3. Не «пересоздать том с данными сессий» как первый шаг  
4. Зафиксировать в memory/guards что регрессировало

## Не делать

- Открывать API secret в клиентском бандле
- Считать успехом «localhost Wi‑Fi only»
- Масштабировать в Redis-кластер до доказанной нужды одной ноды
- Подменять архитектуру на Agora/Twilio без Архитектора

## Плагины

См. `plugins/deployer/PLUGINS.md` и `plugins/realtime/PLUGINS.md`.
