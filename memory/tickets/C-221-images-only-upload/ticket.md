# C-221 — Board upload: images only (no PDF/Word)

**P2** · W-66  
**Зона / Экран:** CustomToolbar media + Files panel copy  
**Зона исполнения:** Frontend (+ defensive MIME on Backend if present)

## Факт
Доска принимает PDF (и упоминания документов); владелец хочет только изображения.

## Ожидание
- `accept` / picker: **image/** only.
- Убрать UX загрузки PDF/Word; обновить подсказки («картинка», не «PDF»).
- Не удалять уже лежащие файлы в campus-data без явного запроса.
- Новые PDF-загрузки блокируются.

## Скрин-улика
toolbar file picker / tooltip after.

## Acceptance
Клиент: выбрать можно только картинку; PDF в UI нет.
