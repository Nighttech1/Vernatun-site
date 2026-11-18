# C-216 — Mobile room QA (iPhone + Android)

**P1** · W-66  
**Зона / Экран:** Campus room SPA — lobby→room chrome, mic/CTA, board toolbar  
**Зона исполнения:** Frontend + Tester (Playwright)

## Факт
На узких вьюпортах раскладка кнопок/тулбаров может давать горизонтальный скролл страницы или недоступные CTA.

## Ожидание
- Playwright **iPhone** (~390) и **Android** (~412).
- Нет document-level H-scroll.
- Кнопки/CTA достижимы без обрезки; сетка не «ломается» в хаос.
- After-скрины обязательны (DOM-assert ≠ закрытие).

## Скрин-улика
`memory/tickets/C-216-mobile-room-qa/visual/` — before/after iphone + android.

## Acceptance
Клиент видит зелёный mobile QA без H-scroll и с досягаемыми CTA на обоих профилях.
