# C-172 — NSFW-сканер интерактивной доски (клиент)

**P1** · W-58 · open

## Зона / Экран
`VernatunWhiteboard` / tldraw (не Fabric.js из ТЗ)

## Факт
Доска без автоматической проверки 18+. Риск порнографических контуров на публичном холсте.

## Ожидание (ТЗ этап 4, адаптация)
- Утилита `nsfwScanner.ts`: lazy load `@tensorflow/tfjs` + `nsfwjs`, debounce ~2.5 с после stroke/shape change.
- Пороги: Hentai+Porn ≥ 0.60 или Sexy ≥ 0.85 → откат локально + data-channel/API rollback для пиров + блок кисти 120 с + предупреждение.
- Audit `CANVAS_VIOLATION` на сервере (вероятности, room, client_id) — без хранения полного PNG по умолчанию.

## Приоритет
P1

## Зона
Frontend (+ Backend audit endpoint)

## Скрин-улика
visual/after.png — предупреждение блокировки рисования
