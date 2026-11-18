# C-169 — Изоляция вкладок и сессий в комнате

**P0** · W-58 · open

## Зона / Экран
Комната Кампуса (`RoomPage` / LiveKit connect)

## Факт
Одна и та же комната открывается во второй вкладке: эхо WebRTC, двойной участник, рассинхрон доски/чата. Нет BroadcastChannel и серверного «один client_id = один join».

## Ожидание (ТЗ этап 1, стек Lounge)
- Клиентский хук `useSingleTabEnforcer(roomId, clientId)`: BroadcastChannel + оверлей «уже открыто в другой вкладке»; стоп mic/connect.
- Сервер: при `POST …/token` (или join) — мьютекс `active_session:{room}:{client_id}`; старый участник вытесняется через LiveKit RoomService (`RemoveParticipant` / force leave), новый получает токен.
- Fallback: `storage` event при отсутствии BroadcastChannel.

## Приоритет
P0

## Зона
Frontend + Backend + Realtime (LiveKit remove)

## Скрин-улика
visual/after.png — оверлей второй вкладки
