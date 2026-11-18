---
name: voice-room-didactics
description: >-
  Scenario Decks, Shared Lexicon→SRS, Fair Speaking Meter, private AI coach
  for Vernatun voice rooms. Use with AI Bridge and Frontend lounge work.
---

# Voice Room Didactics

## Принцип

Голос = транспорт. Ценность = структура практики (CEFR), общая лексика, баланс речи, приватная коррекция.

## Механики V1

| Механика | Синхрон | Примечание |
|----------|---------|------------|
| Scenario Deck | Backend + UI board | Сценарии под CEFR; таймер реплик |
| Shared Room Lexicon | DataChannel и/или API | Клик → у всех; «в мой SRS» |
| Fair Speaking Meter | LiveKit speaking/VAD | Доли времени; без геймификации стыда |
| Private AI Coach | STT → LLM | Только автору реплики; opt-out |

## AI Bridge правила

1. Graceful degrade: падение STT/LLM **не** рвёт SFU-комнату.
2. Не публиковать разбор в общий чат комнаты.
3. Промпты — через `prompt-engineering`; toxicity — отдельные события модерации (`voice-room-safety`).
4. Согласие на обработку голоса до включения coach.

## Frontend

- Доска сценария и lexicon читаемы на 390px.
- Meter не перекрывает CTA микрофона.
- Motion вторичен (`web-perf-motion` если лаг).

## Вне scope этой волны

Форумные баттлы диалектов, мем-хаб, карта диаспоры — соседние epic’и.
