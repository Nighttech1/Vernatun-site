# Chain — W-51 localhost redeploy

1. **Архитектор** — deploy-only spec (этот wave)
2. **Деплоер** — Docker Desktop → `liverooms/infra` compose → `lounge_api.py` :8765 → `liverooms/web` Vite :5173
3. **Тестировщик** — health LiveKit + API `ok` + Campus HTTP 200
4. **Фиксер** — только если health красный
5. **Клиент** — визуальная приёмка /campus

Frontend / Backend / AI Bridge / Motion — **не** звать (код W-50 уже на диске).
