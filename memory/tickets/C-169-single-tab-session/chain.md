# Chain — W-58 Campus Safety (C-169…C-173)

```
Архитектор (готово: architect-spec.md)
  → Backend (legal consent API, session mutex + RemoveParticipant, chat sanitize, report auto-restrict, canvas-violation audit)
  → Frontend (useSingleTabEnforcer, LegalGateModal, chat error UX, nsfwScanner + whiteboard hook, Report reasons + evidence)
  → Realtime (только если нужен LiveKit RoomService helper / data-channel канон — иначе Backend покрывает)
  → Тестировщик (unit/e2e smoke + guards)
  → Фиксер
  → Деплоер localhost
  → Клиент (приёмка DoD)
```

## Порядок тикетов внутри волны

1. **C-170** Legal gate (блокирует connect) — Backend schema/API + Frontend modal  
2. **C-169** Single-tab + session mutex — Frontend hook + Backend/LiveKit  
3. **C-171** Chat moderation — Backend (+ FE error)  
4. **C-173** Report evidence + auto-restrict — Backend + Frontend  
5. **C-172** NSFW board — Frontend (+ Backend audit)

Overlapping paths: `lounge_api.py`, `RoomPage.tsx`, `RoomConnected.tsx`, `ChatPanel.tsx`, whiteboard — **не** параллелить Backend и Frontend на одних файлах без очереди.

## Skills

- `voice-room-safety`
- `livekit-voice-rooms`
- `backend` + data-safety (append-only)
- `responsive-mobile-web` (модалки)
- `tester` / `deployer`
