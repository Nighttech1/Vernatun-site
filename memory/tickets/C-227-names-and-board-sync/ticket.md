### [C-227] Ники участников + общая доска (sync)
- **Зона / Экран:** ParticipantList + VernatunWhiteboard
- **Факт:** После смены ника другие видят NonameN; доска локальная (IndexedDB) — у каждого свой холст
- **Ожидание:**
  1. Remote видят `participant.name` после `setName` (и broadcast rename если нужно)
  2. Доска общая: изменения tldraw синхронизируются через LiveKit data channel (snapshot + diffs), wipe при конце сессии
- **Приоритет:** P0
- **Скрин-улика:** —
- **Зона:** Frontend (+ Backend wipe при session end)
