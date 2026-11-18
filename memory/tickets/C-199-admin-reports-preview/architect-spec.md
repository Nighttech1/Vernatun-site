# Architect-spec — C-199 / C-200

## C-199 Admin layout
- `.shell` horizontal padding ≈ half of current (`1.25rem` → `0.625rem`; max-width можно расширить до ~1200px).
- Список жалоб: CSS grid `2 cols` desktop / `1` mobile; row height ≈ так, чтобы **8 рядов** (16 карточек при 2 col) в `.list-scroll` — фактически **8 строк сетки** → `max-height: calc(8 * row)`.
- Detail panel: показать `evidence` JPEG (data URL или `/api/lounge/admin/evidence/:id`), блок «Кто → на кого», reason, body, `formatTs`.
- ReportDialog: явный блок «Скрин будет приложен» + optional file input (доп. JPEG) → `extra_jpeg_b64` в POST report.

## C-200 Delete API
- `POST /api/lounge/admin/inbox/delete` `{ id }` или `{ ids: [] }`
- `POST /api/lounge/admin/inbox/purge` `{ older_than_days?: number, kind?: "report"|... }`
- `POST /api/lounge/admin/moderation/delete` + purge аналогично
- Перед rewrite jsonl/log: copy to `*.bak.YYYYMMDDHHMMSS`
- Admin UI: × на карточке; toolbar «Удалить по правилу»

## Chain
Backend → Frontend(admin+ReportDialog) → Tester → Fixer → Deployer → Client
