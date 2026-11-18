# C-219 — Author labels: flash + local select only

**P1** · W-66  
**Зона / Экран:** VernatunWhiteboard / ShapeAuthorLabels  
**Зона исполнения:** Frontend

## Факт
C-212 держит постоянные ники на всех фигурах (скрин-щит). Владелец хочет иное поведение.

## Ожидание
1. При создании — кратко показать chip, затем скрыть.
2. При select — показывать chip **только** для фигур локального пользователя (multi-select OK).
3. Текст chip — **белый**.
4. Чужие клиенты **не** видят ваши selection-labels (только локальный overlay).
5. Не оставлять always-on labels на всех shapes.

## Скрин-улика
create-flash; select local; peer view without foreign selection labels.

## Acceptance
Клиент: чужие фигуры без постоянных ников; свой select показывает белый chip; у пира ваших labels нет.
