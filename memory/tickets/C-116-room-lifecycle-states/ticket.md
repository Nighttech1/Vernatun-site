# C-116 — Состояния комнаты: reconnect / kicked / ended

**P1** · W-44 · open

## Факт
Фаза 3: connecting/reconnecting есть; kicked / room ended — добить.

## Ожидание
- Banner при `Reconnecting`.
- Экран/модалка «Вас исключили» при disconnect reason DUPLICATE_IDENTITY / PARTICIPANT_REMOVED / server kick.
- «Комната завершена» при room ended / disconnect ROOM_DELETED / STATE_MISMATCH soft.
- Кнопка «← Все комнаты» на этих экранах.
- Mute-by-default не ломать.

## Зона
Frontend
