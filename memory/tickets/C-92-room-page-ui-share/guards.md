# Guards — C-92 / C-93 (W-36)

## C-92 Room page + share

- [x] `https://vernatunspeakclub.com/room?room=open` → 200, содержит `voiceRoom()`, «Войти в комнату», «Скопировать ссылку»
- [x] `/lounge` карточки → ссылки `/room?room=<id>` (не in-page join)
- [x] Token JSON содержит `share_path` и `display_name`

## C-93 Chat persist until empty

- [x] `POST /api/lounge/chat` → `{ok, message:{id,name,text,ts}}`
- [x] `GET /api/lounge/chat?room=` → messages; при LiveKit online==0 файл очищается
- [x] UI чат на `/room` (история + отправка после входа + DataChannel)

## Manual (Клиент) — 2026-09-20

- [x] Открыть комнату с /lounge → голос как test-room
- [x] Скопировать ссылку → второе устройство в ту же комнату
- [x] Написать в чат → второе устройство видит; выйти всем → чат пуст

Клиент: **ПРИНЯТО / согласовано**. Волна W-36 закрыта.
