# C-223 — Drawing tools hover: color / size popover

**P2** · W-66  
**Зона / Экран:** CustomToolbar — pencil / marker / highlighter  
**Зона исполнения:** Frontend

## Факт
Нет быстрого popover цвета/толщины на hover у инструментов рисования (StylePanel отключён целиком).

## Ожидание
- Desktop hover (или явный affordance): popover **color + size** для draw-инструментов.
- Mobile: не только hover — tap/secondary control (иначе Client REJECT).
- Сохранить язык Vernatun toolbar; не возвращать полный tldraw StylePanel.

## Скрин-улика
hover popover desktop; mobile alternate control.

## Acceptance
Клиент: сменил цвет/размер кисти из popover без охоты по скрытым панелям.
