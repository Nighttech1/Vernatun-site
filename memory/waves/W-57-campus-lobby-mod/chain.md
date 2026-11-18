# Chain W-57

```
Архитектор → Frontend → Backend → Тестировщик → Фиксер → Деплоер (localhost) → Клиент
```

| Step | Role | Scope |
|------|------|--------|
| 1 | Архитектор | spec + storage canon + this chain |
| 2 | Frontend | lobby UI, host icons, Layout/site chrome, remove create/filters/quick-enter |
| 3 | Backend | rooms.json names, POST create 403, campus-data paths |
| 4 | Тестировщик | lobby.spec + smoke localhost; guards |
| 5 | Фиксер | green only |
| 6 | Деплоер | Vite + lounge_api localhost (no VPS) |
| 7 | Клиент | visual accept; VPS только по явной команде |

Motion / AI Bridge / Realtime — не в chain (нет новой SFU-работы).
