# Guards — C-116 room lifecycle

1. `RoomEvent.Disconnected` + `PARTICIPANT_REMOVED` → экран «Вас исключили».
2. `ROOM_DELETED` / `ROOM_CLOSED` → «Комната завершена».
3. `ConnectionState.Reconnecting` → `.room-reconnect-banner`.
4. CTA «← Все комнаты» на lifecycle screens.
5. Mute-by-default: LiveKitRoom `audio={false}` сохранён.
