# Guards — C-119 report + trust

1. `lounge_api.py`: `POST /api/lounge/report`, trust.json, reports.log append.
2. Token `?client_id=` + gate 403 `trust_too_low` для CEFR B1+/B2/C1 при score < 40.
3. FE: `getClientId()` + `fetchToken(room, clientId)`; кнопка «Жалоба» на remote.
4. Live report на prod — после выкладки API (как C-117).
