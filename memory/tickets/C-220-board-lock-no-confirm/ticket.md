# C-220 — Board lock: no confirm + blue active outline

**P2** · W-66  
**Зона / Экран:** HostBoardToolbar lock control  
**Зона исполнения:** Frontend

## Факт
Lock идёт через confirm-диалог (C-213). Для lock это лишний шаг; активное состояние слабо читается.

## Ожидание
- Toggle lock **без** confirm (purge/clear confirms можно оставить).
- Когда доска заблокирована — **синяя обводка** на кнопке lock.
- DC `board.lock` поведение без изменений.

## Скрин-улика
lock off → one click → locked with blue outline; no modal.

## Acceptance
Клиент: один клик lock/unlock; синий outline в active; модалки confirm нет.
