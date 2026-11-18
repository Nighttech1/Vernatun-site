# Vernatun Lounge — голосовые комнаты (домен знания)

Продуктовый контур голосовой практики на сайте Вернатун.

## Канон

- Архитектура: `liverooms/ARCHITECTURE.md`
- План с чекбоксами: `liverooms/DEVELOPMENT_PLAN.md`
- Исследование: `liverooms/Анализ конкурентов языковых комнат.md`
- Роутер агентов: `.cursor/skills/livekit-voice-rooms/SKILL.md`

## Решения (зафиксировано)

- Медиа: **self-hosted LiveKit SFU**, не Discord / не HelloTalk / не primary Twilio/Agora.
- Клиент комнат: **React + @livekit/components-react** (отдельно от static Alpine-лендинга).
- Ценность: дидактика (Scenario, Lexicon→SRS, Fair Meter) + академическая безопасность (Trust Score, сцена/зал).

## Не смешивать

- Cortana / Sputnik Life OS retrieval — другой домен (`knowledge/area_sputnik/` если есть).
- Форум / карта диаспоры / мемы — соседние epic’и, не блокируют Lounge V1.
