### [C-168] Нет create + хранение campus-data/rooms
- **Зона / Экран:** Лобби + API + VPS path
- **Факт:** Убрать создание новых комнат; материалы комнат — в папках Vernatun на VPS.
- **Ожидание:**
  - UI create отсутствует; POST `/api/lounge/rooms` → 403 create_disabled
  - Канон: `LOUNGE_CAMPUS_DATA` → `{root}/rooms/{roomId}/chat.json|session.json|uploads/`
  - Local: `liverooms/campus-data/` · VPS: `/var/www/vernatun/campus`
- **Приоритет:** P0
- **Зона:** Backend + Frontend + Deployer (docs)
