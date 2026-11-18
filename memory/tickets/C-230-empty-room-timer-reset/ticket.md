### [C-230] Таймер обнуляется когда комната пуста
- **Зона / Экран:** session.json / lobby badge
- **Факт:** После ухода последнего участника таймер сессии продолжает тикать
- **Ожидание:** При LiveKit online==0 → `end_room_session(reason=empty)` (wipe chat/session/uploads); надёжный путь: webhook participant_left + фоновый sweeper активных session.json
- **Приоритет:** P0
- **Скрин-улика:** —
- **Зона:** Backend
