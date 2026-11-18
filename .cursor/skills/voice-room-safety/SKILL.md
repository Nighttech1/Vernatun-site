---
name: voice-room-safety
description: >-
  Academic Trust Score, stage/audience roles, anti-dating UX, toxicity mute,
  moderation for Vernatun voice rooms. Use with Backend and Client review.
---

# Voice Room Safety — академическая чистота Lounge

## Цель

Не повторить HelloTalk/Tandem: травля, захват ведущими, дейтинг-смещение, спам микрофонами.

## Четыре уровня (канон ARCHITECTURE §7)

1. **UI-политика:** нет гео «рядом», фильтра по полу, крупных фото, ЛС между незнакомцами в Lounge V1. Профиль = язык, CEFR, темы, бейджи.
2. **Mute-by-default + host mute/kick.** Одновременная речь разрешена (TeamSpeak-модель); spam mic → mute нарушителя, не запрет multi-speak всем.
3. **Academic Trust Score:** порог на B2/C1; жалобы и нарушения снижают доступ.
4. **Toxicity pipeline:** маркеры → авто-mute + escalate админу; без публичного шейминга.

## Backend обязанности

- Хранить trust score и audit (kick/mute/report) без удаления истории без запроса пользователя.
- Gate на `GET …/token`: CEFR + trust + password + **бан (client_id и/или IP, вариант A)**.
- Баны: append-only `campus-data/bans.jsonl`; last-seen IP в `client_seen.jsonl`; Owner API `admin/bans` + lift.
- Не отдавать клиенту лишние PII; в Политике конфиденциальности раскрыть client_id/IP/баны.

## Frontend обязанности

- Не добавить «социальные» контролы, ломающие уровень 1.
- Ясные состояния: muted / hand raised / removed.
- Жалоба доступна на mobile (не только hover).

## Клиент (приёмка)

Жёсткий reject, если UI выглядит как дейтинг или микрофон открыт у всех при входе.

## Связки

- Роутер: `livekit-voice-rooms`
- AI toxicity: `voice-room-didactics` + `ai-bridge`
- HITL админ: при наличии — `cortana-stack` / Telegram, не блокер V1
