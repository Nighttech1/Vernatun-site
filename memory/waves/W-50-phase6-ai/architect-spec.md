# Architect Spec — W-50 Phase 6 AI (Lounge)

## Цель
После стабильного аудио добавить **опциональный** AI-контур: STT → private coach (+ filler) → toxicity → consent/opt-out.  
Критерий фазы: при падении LLM/STT **SFU и комната работают**; AI — graceful degrade.

## Вне scope
- Telegram HITL
- Публичный «шейминг» разбора в общем чате
- Запись эфира на диск
- Prod/VPS деплой
- Замена host escalate stub полной автоматикой kick без host

## Контракты слоёв

### 1) Consent (C-144) — ворота всего AI
- UI в room (до первого разбора): согласие на AI-разбор **своей** речи; явный opt-out.
- Хранение: `localStorage` ключ `vernatun.lounge.aiConsent` + опционально stub API `POST /api/lounge/ai/consent` (append-only preference, без wipe).
- Без consent: не слать аудио/текст в STT/coach; toxicity host-escalate остаётся как сейчас.
- Copy: коротко, по-русски, без legal wall of text; ссылка на `ROOM_RULES.md` AI-секцию (дописать stub).

### 2) STT (C-140)
- **V1 путь:** после unmute участник может отправить **текстовый снимок реплики** (ручной «Отправить на разбор» или короткий buffer) → API `POST /api/lounge/ai/stt` **или** DataChannel topic `ai.stt` → backend.
- **Не** подключать полный LiveKit egress recording в этой волне (дорого/юридически) — в spec зафиксировать как L2.
- Stub: если нет `OPENAI_API_KEY` / STT provider — ответ `{ ok:false, degraded:true }` без 5xx шторма.
- Аудио blob upload — только если consent + size limit; иначе text-first MVP.

### 3) Private coach (C-141) + filler (C-142)
- Endpoint `POST /api/lounge/ai/coach` body: `{ room, identity, text, lang }`.
- Response **только** запросившему identity: `{ notes, fillers[], alternatives[] }`.
- Frontend: боковая панель «Мой разбор» (не общий чат, не lexicon board).
- Prompt: `prompt-engineering` — CEFR-aware, без публичного тона; filler = паразиты + 1–2 естественные замены.
- LLM fail → UI «Разбор временно недоступен», комната без изменений.

### 4) Toxicity (C-143)
- Classifier на том же тексте (или stub keyword list если нет модели).
- При hit: append `escalation.log` / `moderation.log` kind=`toxicity_ai` + событие в Owner Inbox (как escalate stub W-46).
- **Не** auto-kick; host видит escalate; mute-by-default / multi-party не менять.
- Без consent автора — toxicity только на **явную жалобу** / host escalate (существующий путь).

### 5) Data-safety
- Только append логов; не truncate moderation/inbox/trust.
- Не трогать `sputnik_data.db`, `memory_storage`.

## Acceptance (язык Клиента)
1. В комнате без согласия AI — обычный эфир, кнопка согласия видна.
2. С согласием — свой разбор видит только автор; соседи не видят текст coach.
3. Выключить согласие — новые разборы не уходят.
4. Остановить AI API — комната всё ещё «В ЭФИРЕ», mic/чат/lexicon работают.
5. Toxicity stub пишет событие в Модерацию / escalate, без auto-kick.

## Skills
`livekit-voice-rooms`, `voice-room-didactics`, `ai-bridge`, `prompt-engineering`, `backend`, `pydantic-v2` (если модели), `webrtc-realtime-ops` (Deployer localhost only).
