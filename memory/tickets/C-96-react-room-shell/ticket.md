# C-96 — React Room shell: LiveKit multi-party

**P0** · W-37 · **closed** + guards (await Client + dual-peer manual 2026-09-20)

## Зона / Экран
Страница комнаты (`/room?room=` или SPA-маршрут). Frontend A + LiveKit components.

## Факт
Static `/room` умеет: токен, unmute по жесту, speaking-dot, share link, чат до опустошения. Канон Фазы 3: `@livekit/components-react`, `<RoomAudioRenderer />`, reconnect, multi-party список участников.

## Ожидание
- Подключение через JWT с `/api/lounge/token?room=`
- Mic **off** при входе; unmute только по user gesture
- Несколько участников могут говорить одновременно (не Stage-очередь)
- Список участников + индикатор speaking
- `<RoomAudioRenderer />` + базовый reconnect UX (connecting / reconnecting)
- Share-ссылка на эту комнату (паритет C-92)
- Чат комнаты через существующий API (паритет C-93) — минимум: читать/писать как сейчас
- Без дейтинг-UI

## Приоритет
P0

## Скрин-улика
Prod `/room?room=open` — эталон поведения; UI переносится в React.

## Зона
Frontend (Realtime — консультация docs MCP при сомнениях API)
