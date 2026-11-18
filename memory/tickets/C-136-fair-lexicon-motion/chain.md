# Chain — W-49 P2 UI/ops

```
Архитектор
  → Backend (C-138 API + C-137 Grafana/compose)   [не overlap с Motion]
  → Frontend admin (C-138 вкладка)                [после API]
  → Motion (C-136 room.css / лёгкий enter)        [параллельно admin OK]
  → Docs (C-139 LOAD_CAPACITY + README/RUNBOOK)
  → Тестировщик (guards + smoke API/compose)
  → Фиксер (при красном)
  → Деплоер localhost (API + admin + metrics profile; VPS НЕТ)
  → Клиент
```

## Paths по ролям

| Роль | Paths |
|------|--------|
| Backend | `liverooms/infra/vps/lounge_api.py`, `liverooms/infra/docker-compose.yml`, `liverooms/infra/grafana/**`, `liverooms/infra/README.md` |
| Frontend admin | `liverooms/admin/index.html`, `app.js`, `styles.css`, `README.md` |
| Motion | `liverooms/web/src/styles/room.css`, при нужде `ParticipantList.tsx` / `RoomSidePanel.tsx` |
| Docs | `liverooms/LOAD_CAPACITY.md`, `liverooms/RUNBOOK.md`, `liverooms/DEVELOPMENT_PLAN.md` |
| Tester | `memory/tickets/C-136…139/guards.md` |
| Deployer | localhost API :8765, admin :5174, Grafana :3000 |

## Запрет
AI Bridge не звать. Flutter не звать. Prod/VPS не трогать.
