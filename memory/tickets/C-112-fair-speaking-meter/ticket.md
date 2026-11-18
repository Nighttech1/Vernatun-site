# C-112 — Fair Speaking Meter в комнате

**P1** · W-43 · open

## Зона / Экран
Room shell · участники / center · `RoomConnected` + `ParticipantList`

## Факт
Нет видимого баланса речи. План фаза 4: Fair Speaking Meter по speaking/VAD LiveKit.

## Ожидание
- Копить секунды «говорит» по `useIsSpeaking` / active speakers для **реальных** участников (не mock-ахпериков).
- Компактный meter: доли % или полоски у каждого ника + короткая сводка «баланс речи» (без стыда/рейтинга «хуже всех»).
- Не перекрывать CTA микрофона; читаемо на mobile.
- Сброс при выходе из комнаты.

## Приоритет
P1

## Зона
Frontend
