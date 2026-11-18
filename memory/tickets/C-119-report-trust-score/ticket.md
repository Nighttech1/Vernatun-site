# C-119 — Жалоба + Academic Trust Score (MVP)

**P1** · W-45 · open

## Ожидание
- Кнопка «Жалоба» у remote-участника (и mobile, не только hover).
- Backend: `POST /api/lounge/report` → append `reports.log`; снизить trust identity в `trust.json`.
- Порог: при trust < 40 отказ token для комнат CEFR B2/C1/B1+ (мягкий gate); open/A1 — без gate.
- Default trust = 100 для новых identity.
- Data-safety: только append/update scores, без wipe.

## Зона
Backend + Frontend
