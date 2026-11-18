# Guards W-56

## C-155
- Нет `.board-scenario-select` в chrome доски

## C-156
- Тулбар вертикальный (`.wb-toolbar-dock--vertical`), grip ⋮⋮, `title` на кнопках
- Позиция в `localStorage` `vernatun-wb-toolbar:{roomId}`

## C-157
- PDF/image не isLocked → resize select-handles
- Вкладка Файлы показывает список после загрузки

## C-158
- `GET /api/lounge/session?room=` → remainingSec ≈ 5400 при старте
- Topbar `⏱ h:mm:ss` countdown
- 0 участников / timeout → end_room_session (чат+purge), комната в каталоге жива

## C-159
- Вкладки справа: только Чат / Словарь / Файлы (нет «Разбор»)

## C-160
- brief: `memory/tickets/C-160-capacity-decision/brief.md`

## Commands
```
cd liverooms/web && npx tsc --noEmit
Invoke-RestMethod http://127.0.0.1:8765/api/lounge/session?room=vernatun-smoke
```
