# Guards — C-131 Create room + password

1. `POST /api/lounge/rooms` создаёт dynamic room; password → password_hash.
2. Token с wrong password → 403 bad_password.
3. Лобби: форма «Создать комнату» активна (не aria-disabled stub).
4. Seed rooms.json не wipe.
