### [C-235] Полная синхронизация стилей заметок на доске
- **Зона:** tldraw sync
- **Факт:** Текст в заметках у разных клиентов разный цвет/шрифт
- **Ожидание:** Diff/snapshot включает style props (color, size, font, align…); при apply не терять; при необходимости force snapshot после style change
- **Приоритет:** P0
- **Зона:** Frontend
