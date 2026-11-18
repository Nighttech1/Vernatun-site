# W-37 — React Lounge Phase 3 (каркас + лобби + room shell)

**Статус: ready_for_client · Client verdict below · 2026-09-20**

## Контекст
W-36 (static `/lounge` + `/room` + chat) — **ПРИНЯТО / согласовано**.  
План: `liverooms/DEVELOPMENT_PLAN.md` → **Фаза 3** (целевой React SPA).

## Тикеты (≤3)
| ID | Суть | P | Статус |
|----|------|---|--------|
| C-94 | Vite/React каркас `liverooms/web/` + бренд | P0 | closed + guards |
| C-95 | React-лобби + фильтр + CTA | P0 | closed + guards |
| C-96 | Room shell `@livekit/components-react` + share/chat | P0 | closed + guards (dual-peer manual) |

## Localhost (Деплоер)
**http://127.0.0.1:5173/lounge**  
Room: **http://127.0.0.1:5173/room?room=open**  
API proxy → `https://vernatunspeakclub.com/api/…`  
Static prod fallback не трогали.

## Evidence
- `npm run build` green
- anti_slop OK
- After: `W-37-after-lobby-desktop.png`, `…-iphone.png`, `…-android.png`, `W-37-after-room-joined.png`
- Join → `ахперик 1`, mic off, chat/share present

## Out of scope
Scenario/Lexicon/Fair Meter; Trust Score; AI; VPS SPA cutover.
