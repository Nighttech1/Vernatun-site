# Architect-spec — W-70 / C-248…C-251

## Тикеты
| ID | Суть | Зона | P |
|----|------|------|---|
| C-248 | Убрать полосу под кнопками ведущего; кнопки flat на доске ниже надписи | FE | P1 |
| C-249 | Убрать плашку «Общий» на карточке слова | FE | P2 |
| C-250 | Каскад host: 2→3→4… до последнего | BE (+ FE ensure) | P0 |
| C-251 | Dropdown «Пожаловаться»: ширина = кнопке, скруглённые края списка | FE | P1 |

## C-248
- Убрать `.host-board-toolbar-slot` как chrome-полосу (bg/border).
- Рендер toolbar абсолютом поверх canvas (как `.board-guest-canvas-label`), `top` ниже надписи (~2.1–2.4rem), `pointer-events: auto` на кнопках.
- Кнопки остаются отдельными; без общей «ленты»-подложки.

## C-249
- В `VocabCardShape` не рендерить badge при `dialect === 'common'`.
- Редактор: dialect select можно оставить (внутренний).

## C-250
- `promote_next_host_if_needed`: при отсутствии host среди remaining → earliest `joined_at` (это и есть каскад).
- Webhook: читать identity ушедшего; если ушёл host / нет host → promote.
- FE: после `ParticipantDisconnected` всегда вызывать `postHostEnsure` с ретраями 0.4s / 1.2s (идемпотентно если host есть).
- Документировать: права идут по порядку входа 2→3→…→последний.

## C-251
- Заменить native `<select>` в ReportDialog на кастомный listbox (`VernatunSelect`):
  - trigger width 100% диалога;
  - panel `width: 100%` того же контейнера, `border-radius: 12px`, overflow hidden;
  - клик вне / Escape закрывает.

## chain.md
1. Frontend (C-248, C-249, C-251)
2. Backend (C-250)
3. Tester
4. Fixer
5. Deployer localhost
6. Client
