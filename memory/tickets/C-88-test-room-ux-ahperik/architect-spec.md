# Architect-spec C-88

- Перезаписать `test-room.html` чистым UTF-8 (не PowerShell Set-Content).
- Имя: API `/api/lounge/token` возвращает `display_name: "ахперик N"` (N = max существующих + 1 через RoomService list participants; fallback client-side).
- UI: шаги «1. Войти → 2. Микрофон»; список участников единый; круг `size-3` + `ring` при speaking.
- Speaking: `RoomEvent.ActiveSpeakersChanged`, не только micOn.
- Deploy: test-room.html + token_server.py на VPS.

Chain: Frontend → Realtime/Deployer (token) → Tester → Client
