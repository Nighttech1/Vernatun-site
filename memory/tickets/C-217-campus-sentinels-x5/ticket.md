# C-217 — Campus Sentinels ×5 (Evidence-First, sanctions OFF)

**P0** · W-66  
**Зона / Экран:** Room chat/board + lounge_api incidents + Admin Модерация + robots help  
**Зона исполнения:** Frontend + Backend + Admin (+ docs prompts stub)

## Факт
Сейчас 3 stub-робота в help (C-215) без полного Evidence-First контура; нужны **5** сентинелов: фиксация → инцидент → удаление контента; **без** авто-ban/mute/trust.

## Ожидание
1. **Pipeline:** keyword/regex/heuristic → capture evidence → `POST /api/lounge/incidents` → delete shape/chat.
2. **SANCTIONS OFF:** роботы не банят, не мьютят, не трогают Trust; баны только владелец.
3. **Нет live LLM** в этой волне; тексты промптов — в docs на потом.
4. Admin Модерация показывает инциденты; `?` help — **5** карточек с суммированными ролями:
   - Повестка · Тон · Холст 18+ · Спам · Границы  
   (полные формулировки — `architect-spec.md` W-66).
5. Тост «контент снят» ок; «вы заблокированы» — запрещён.

## Скрин-улика
Admin help ×5; Moderation feed с инцидентом; room after auto-delete.

## Acceptance
Клиент: пять ролей в «?»; тестовый матч создаёт запись в Модерации и убирает контент; участник остаётся в комнате без авто-бана.
