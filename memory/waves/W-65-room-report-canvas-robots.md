# W-65 — Room report UX + guest canvas watermark + admin robots

## Plan
1. C-209 Report: no per-participant «Жалоба»; dialog target dropdown; full reason list from rules
2. C-210 Participant plaque: remove «Это вы · 2× клик…»
3. C-211 Board banner «Гостевой холст участников» ×2 height; remove watermark license line
4. C-212 Always-on author nick labels on shapes (+ selection hint)
5. C-213 Host toolbar: centered icon row + styled confirm modals
6. C-214 Admin checkbox inside card
7. C-215 Moderation «?» robots roles (3 automated scanners — stubs/docs, no LLM)
8. Answer ban/VPN in Client report

## Chain
Архитектор → Frontend → Backend (reason codes) → Admin → Тестер → Деплоер → Клиент

## Deploy (localhost)
- Date: 2026-09-27 — gate: Client acceptance only (no VPS/prod)
- Live (no restarts needed — already up):
  - Lounge API `http://127.0.0.1:8765/api/lounge/rooms` → 200
  - Campus Vite `http://127.0.0.1:5173` → 200
  - Admin cabinet `http://127.0.0.1:5174` → 200
  - LiveKit stack (`liverooms/infra` docker compose): livekit, coturn, grafana, prometheus — Up

## Client (приёмка 2026-09-27)

**Вердикт:** ПРИНЯТО С ЗАМЕЧАНИЯМИ

**Где смотрел:** Playwright MCP desktop 1440×900
- Room: `http://127.0.0.1:5173/room?room=mansarda`
- Admin: `http://127.0.0.1:5174` (вход владельца)
- Скрины: `memory/waves/W-65-shots/`
  - `room-main-1440.png`, `report-dialog-1440.png`, `shape-author-label-1440.png`, `host-confirm-modal-1440.png`
  - `admin-reports-checkbox-1440.png`, `admin-moderation-1440.png`, `admin-robots-help-1440.png`

| Тикет | Вердикт | Доказательство |
|-------|---------|----------------|
| C-209 | **закрыто** | Нет «Жалоба» у ника; общая «Пожаловаться»; диалог с combobox «На кого» + полный список причин |
| C-210 | **закрыто** | На плашке только «Вы», нет «Это вы · 2× клик…» |
| C-211 | **закрыто** | Баннер «Гостевой холст участников», без watermark/license-строки |
| C-212 | **закрыто** | На стикере chip `Noname1` (DOM `.shape-author-chip` + скрин) |
| C-213 | **закрыто** | Тулбар модерации по центру; `alertdialog` «Очистить всю доску?» (не `window.confirm`) |
| C-214 | **не закрыто** | Checkbox **под** карточкой, не внутри: `getComputedStyle(.list-item-check).position === "relative"` из‑за каскада `.row-check { position: relative }` после `.list-item-check { position: absolute }` |
| C-215 | **закрыто** | Вкладка Модерация → «?» → модалка с 3 ролями: Повестка / Тон / Холст 18+ (stubs «ожидает ваш текст» — по ТЗ ок) |

**Новые C-*:** не открывались (пробел уже покрыт открытым C-214).

**Prod:** нет — открыт P1 C-214.

**Ban/VPN:** не отвечает Клиент (Оркестратор).
