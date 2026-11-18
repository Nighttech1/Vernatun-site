# C-214 — Checkbox жалобы внутри плашки

**P1** · W-65 · admin styles/app.js

## Client note (W-65, 2026-09-27) — НЕ ПРИНЯТО

Live Admin 1440: чекбокс оказывается **под** `.list-card`, не внутри плашки.
Причина: элемент `label.row-check.list-item-check` получает `position: relative` из `.row-check` (ниже в `styles.css`), что перебивает `.list-item-check { position: absolute }`.
Ожидание: checkbox visually inside card (top-left inset), `getComputedStyle` → `position: absolute` (или более специфичный селектор `.list-item-check.row-check`).
Скрин: `memory/waves/W-65-shots/admin-reports-checkbox-1440.png`.
