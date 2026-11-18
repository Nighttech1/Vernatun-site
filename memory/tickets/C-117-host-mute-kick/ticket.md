# C-117 — Host mute / kick (multi-party сохраняется)

**P0** · W-44 · open

## Факт
Фаза 5 P0: mute-by-default уже есть; host mute/kick — нет.

## Ожидание
- Первый вошедший в пустую комнату = host (`room_admin` + metadata role=host в токене).
- Host в списке участников: кнопки «Mute» / «Kick» на remote (не на себе, не на mock).
- Backend `POST /api/lounge/moderation` → LiveKit RoomService (mute publish / remove).
- Клиент после kick видит состояние C-116.
- Одновременная речь остальных не запрещается (только нарушитель).

## Зона
Backend + Frontend
