# Architect-spec — W-46 / C-121–C-126

## Цель
Закрыть пробелы плана: регресс-чеклист P0, ручной escalate токсичности, Playwright лобби, runbook, шаблоны сценариев + подсказки спикеру. Trust gate B2/C1 уже есть — только отметить в плане.

## Инварианты
- Multi-party; mute-by-default; data-safety (append trust/moderation, no wipe).
- DataChannel `vernatun:` JSON; ignore bad parse.
- VPS/prod не трогать без «да» Клиента.
- Host controls только если `isHost` из token.

## C-121 REGRESSION.md
Пути: `liverooms/REGRESSION.md` + `memory/tickets/C-121-…/guards.md`.
Сценарии: expired/invalid token UI; kick screen; host leave ≠ room end для peers; TURN checklist (compose coturn + LTE note).

## C-122 Escalate
Backend `lounge_api.py`:
- `action` in `mute|kick|escalate`
- escalate → same as mute + `TRUST_ESCALATE_PENALTY=25` if `target_client_id` + append mod log reason
- body: optional `target_client_id`, `reason`

Frontend:
- `postModeration` action union + optional fields
- ParticipantList: button Escalate (host only, !isMe)
- status toast в RoomConnected

## C-123 Playwright
- `liverooms/web/tests/lobby.spec.mjs` + script `test:lobby` using playwright chromium
- Start: assume `vite` on 5173 OR use `webServer` in config
- Assert: h1/brand Кампус, `.lobby` rooms or error, no h-scroll at 390

## C-124 RUNBOOK.md
`liverooms/RUNBOOK.md` — plain Russian + commands.

## C-125 Templates
- `src/content/scenarioTemplates.ts` — 4 BoardDemo-like + `hints: string[]`
- Extend `BoardDemo` with optional `hints`
- DataChannel: `{ type: 'scenario.set', templateId: string, by: string }`
- BoardPanel select; RoomConnected state `activeTemplateId`

## C-126 Hints
- ParticipantRow: if speaking && hints?.length → show first 2 under status
- Pass hints from RoomConnected via ParticipantList

## Rooms
Optional: add `b2` room with cefr B2 for gate demo (seed only).

## Chain
```
Архитектор
→ Backend (C-122)
→ Frontend (C-122 UI, C-125, C-126)
→ Docs (C-121, C-124)
→ Тестировщик (C-123 Playwright + guards)
→ Фиксер
→ Деплоер localhost
→ Клиент
```
