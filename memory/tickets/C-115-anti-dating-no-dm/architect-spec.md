# Architect-spec — W-44 / C-115–C-117

## Цель
Закрыть фазу 5 P0 (антидейтинг + host moderation) и фазу 3 состояния kicked/ended.

## Инварианты
- Multi-party; mute-by-default (`audio={false}`).
- Data-safety: не wipe chat/DB без запроса.
- VPS deploy API — по возможности localhost-прокси; код в `lounge_api.py` готов к выкладке после «да».
- Mock-ахперики не модерируются.

## C-115 Frontend
- `ChatPanel`: заголовок «Общий чат комнаты · не личные сообщения».
- `LobbyPage` rules banner: явный пункт «без дейтинга / без ЛС / без гео».
- `ParticipantList`: только initials; нет upload фото.
- Убрать любые future DM hooks если есть.

## C-116 Frontend
- `RoomPage` / `RoomConnected`: state `leaveReason: null | 'kicked' | 'ended' | 'left'`.
- Listen `RoomEvent.Disconnected` + `DisconnectReason` (PARTICIPANT_REMOVED → kicked; ROOM_DELETED → ended).
- `Reconnecting` → top banner strip.
- Full-screen soft panels with CTA to `/campus`.

## C-117 Backend (`lounge_api.py`)
1. `make_token(..., is_host)`: `room_admin=is_host`; metadata `{"role":"host"|"member"}`.
2. Host if `livekit_online(room)==0` before join.
3. Token response: `is_host: bool`.
4. `POST /api/lounge/moderation` JSON:
   `{ "room", "action": "mute"|"kick", "target_identity", "requester_identity" }`
   - Verify requester is participant with metadata role=host OR room_admin via list_participants metadata.
   - mute: `UpdateParticipant` permission can_publish=False (and optionally mute published tracks).
   - kick: `RemoveParticipant`.
5. Append-only audit line to `moderation.log` (no delete).

## C-117 Frontend
- Pass `isHost` from token into RoomConnected.
- ParticipantRow remote: Mute/Kick if `isHost`.
- API `postModeration(...)`; on failure show status.
- DataChannel optional `mod.kick_notice` for faster UX (nice-to-have).

## Chain
```
Архитектор → Backend (C-117 API) → Frontend (C-115→C-116→C-117 UI) → Тестировщик → Фиксер → Деплоер localhost → Клиент
```
