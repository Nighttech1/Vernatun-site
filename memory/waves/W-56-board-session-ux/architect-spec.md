# Architect — W-56

## Тикеты
| ID | Суть | Зона |
|----|------|------|
| C-155 | Убрать селектор сценариев с chrome доски | FE |
| C-156 | Вертикальный 1-ряд тулбар, tooltip, drag+localStorage | FE |
| C-157 | Resize вложений + список в вкладке Файлы | FE (+ DC meta) |
| C-158 | Сессия 90 мин: старт с 1-го live, сброс при 0 / timeout; комната живёт | BE + FE |
| C-159 | Скрыть вкладку «Разбор» | FE |
| C-160 | Capacity brief: самосоздание vs 10 комнат | Docs / Оркестратор |

## Контракты
### Session (`lounge_api`)
- `GET /api/lounge/session?room=` → `{ ok, active, startedAt, endsAt, remainingSec }`
- Старт: при выдаче token / первом join, если нет active session → `startedAt=now`, `endsAt=now+5400`
- Конец: LiveKit 0 участников **или** `now>=endsAt` → clear chat, purge board storage, wipe session file; **каталог комнаты не трогать**
- FE topbar: countdown оставшегося; без Start/Reset сценария на доске

### Board files
- Upload → shape **не** isLocked (resize select-handles)
- `onFilesChange(files[])` → RoomSidePanel «Файлы»
- Meta: `{ id, name, kind: image|pdf|audio, shapeId }`

### Toolbar
- Vertical island, icon buttons + `title`/`aria-label`
- Drag handle; pos в `localStorage` key `vernatun-wb-toolbar:{roomId}`

## Chain
Frontend → Backend → Tester → Deployer → Клиент  
(C-160 параллельно docs, без кода)
