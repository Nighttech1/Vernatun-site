# W-64 Plan — Join + Gate + Board security + Admin UX

## Корневые причины (п.1)
1. «Странное окно» = LegalGate («Подтверждение перед входом») — обновить по TASK (один чекбокс + жёсткий дисклеймер).
2. Kick после входа: LiveKit на `:7880` **не запущен** → токен выдаётся, WebSocket падает → экран «выкинули». Деплоер поднимает `docker compose` LiveKit.

## Тикеты
| ID | P | Суть |
|----|---|------|
| C-202 | P0 | LiveKit up + стабильный join без ложного kick |
| C-203 | P1 | Убрать AS IS / английский из оферты |
| C-204 | P0 | EntryGate: 1 checkbox + disclaimer + ссылки |
| C-205 | P1 | tldraw meta author + presence name |
| C-206 | P1 | Host: board R/O, purge by author, clear board |
| C-207 | P1 | Report: PNG + board JSON snapshot (только при жалобе) |
| C-208 | P0 | Admin: styled selects, purge menu, checkboxes, clean detail + mocks |

## Chain
1. Деплоер: LiveKit docker (параллельно с Arch docs)
2. Backend: report evidence JSON/PNG path; mock seed endpoint optional
3. Frontend: gate, board meta/host tools, report capture, terms text
4. Admin UI
5. Tester → Fixer → Deployer localhost → Client
