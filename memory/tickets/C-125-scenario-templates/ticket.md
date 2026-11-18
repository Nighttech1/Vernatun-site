# C-125 — Шаблоны сценариев

**P2** · W-46 · closed

## Ожидание
- 4 шаблона: дебаты / таможня / собеседование / лексическая игра — контент доски (hy/phonetic/ru).
- В BoardPanel: выбор шаблона (select); sync через DataChannel `vernatun:scenario.set` `{ templateId, by }`.
- Дефолт = текущий `getBoardDemo(roomId)`; шаблон перекрывает до смены/выхода.

## Зона
Frontend
