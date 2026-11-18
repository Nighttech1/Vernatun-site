# W-50 — Фаза 6 AI-контур (STT → coach → filler → toxicity → consent)

**Статус:** implemented · awaiting Client «согласовано» · 2026-09-23  
**before_sha:** no-git  
**Plan:** `liverooms/DEVELOPMENT_PLAN.md` фаза 6  
**Spec:** `memory/waves/W-50-phase6-ai/architect-spec.md`  
**Chain:** `memory/waves/W-50-phase6-ai/chain.md`

## Тикеты
| ID | Суть | P | Guard |
|----|------|---|-------|
| C-140 | STT поток реплики (text-first) | P2 | yes |
| C-141 | Private coach только автору | P2 | yes |
| C-142 | Слова-паразиты + альтернативы | P2 | yes |
| C-143 | Toxicity → событие модерации | P2 | yes |
| C-144 | AI consent + opt-out | P2 | yes |

## Что сделано
- Backend: `POST /api/lounge/ai/{consent,stt,coach}` в `lounge_api.py` (degraded HTTP 200)
- AI Bridge: `liverooms/ai/prompts/coach_system.txt`, `toxicity_system.txt`
- Frontend: вкладка **Разбор** → `PrivateCoachPanel` (consent + private result)
- ROOM_RULES.md секция AI
- Smoke: consent → coach fillers; toxicity flag; комната «В ЭФИРЕ» при degrade
- Visual: `client-room-coach-1440.png`

## Инварианты
- multi-party + mute-by-default не ломать ✅
- AI падает → комната жива ✅
- coach не в общий чат ✅
- data-safety append-only ✅
- Telegram HITL / VPS — не делали ✅

## Localhost
- Campus http://127.0.0.1:5173/campus
- API http://127.0.0.1:8765/
- LiveKit ws://127.0.0.1:7880 (нужен `LIVEKIT_PUBLIC_URL` из `LIVEKIT_URL`)
- Vite proxy: `liverooms/web/.env.local` → `VITE_API_PROXY_TARGET=http://127.0.0.1:8765`
