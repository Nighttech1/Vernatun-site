# Guards — C-82 / C-83 / C-84 (W-32)

## C-82 Architecture + phase 0

- [x] `liverooms/ARCHITECTURE.md` §5: multi-party simultaneous speak (TeamSpeak / Discord Voice), not Stage-only
- [x] Phase 0 checkboxes in `DEVELOPMENT_PLAN.md` marked done
- [x] URL `/lounge`, media host localhost Docker now, VPS after Client
- [x] CEFR set: open / A1 / B1 / slang
- [x] `liverooms/ROOM_RULES.md` stub

## C-83 LiveKit SFU

- [x] `docker compose` in `liverooms/infra/` — services `livekit` + `coturn` **running**
- [x] Health: `python plugins/realtime/livekit_health_check.py --url http://127.0.0.1:7880` → `ok: true`, status 200
- [x] Dev keys: `devkey` / `secret` (--dev); `.env` gitignored via root `.gitignore`
- [x] Ports documented in `liverooms/infra/README.md`

## C-84 TURN + dual-peer

- [x] coturn up on 3478 (UDP/TCP) in compose
- [x] Meet smoke: `python liverooms/meet/token_server.py` → http://127.0.0.1:8765/
- [x] Token API returns JWT with `can_publish` + `can_subscribe`
- [ ] **Manual dual-peer audio** (Клиент / человек): два окна `/?as=a` и `/?as=b`, Join → Unmute оба, говорить одновременно — слышат друг друга  
  Playwright **не** закрывает этот пункт.

## Regression

Не трогать static landing HTML в этой волне. Не деплоить LiveKit на VPS без явного «да».
