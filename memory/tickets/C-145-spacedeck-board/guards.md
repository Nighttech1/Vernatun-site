# Guards — C-145 Spacedeck board

1. `GET http://127.0.0.1:9666/` → HTTP 200 (Spacedeck container).
2. `GET /api/lounge/board?room=open` → `ok` + `url` pointing at Spacedeck.
3. Room center shows iframe «Общая доска Spacedeck», not mock toolbar `✎ □ T` alone.
4. NOTICE.md documents AGPL + storage path.
