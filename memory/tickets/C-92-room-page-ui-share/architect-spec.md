# Architect-spec W-36 C-92/C-93

## Pages
- `/lounge` — каталог, карточки = ссылки на `/room?room=<id>`
- `/room.html` (+ clean URL `/room`) — полный UI как test-room + share + chat

## Chat
- `GET /api/lounge/chat?room=` → `{messages:[{id,name,text,ts}]}`
- `POST /api/lounge/chat` JSON `{room,name,text}` → append; max 200 msgs/room
- File store: `chat_<room>.json` next to lounge_api; delete when online==0 after leave webhook or lazy check on GET if LiveKit empty
- Client: load history on join; send via POST + `localParticipant.publishData`; listen `RoomEvent.DataReceived`

## Chain
Architect → Backend (chat API) → Frontend (lounge links + room.html) → Deployer → Tester → Client
