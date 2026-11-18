# Guards — C-94 React SPA scaffold

## Checks (2026-09-20)
1. `cd liverooms/web && npm run build` → exit 0 (`tsc --noEmit && vite build`)
2. `python plugins/frontend/anti_slop_scan.py liverooms/web` → OK
3. Dev: `npm run dev` binds `http://127.0.0.1:5173/` (`strictPort` + host)
4. Routes exist: `/` → `/lounge`, `/room?room=`
5. Brand tokens in CSS: parchment `#F9F6F0`, azure `#2A5A84`, terracotta `#C95B36` (no purple SaaS)

## Evidence
- Build green in W-37 Tester pass
- After: `memory/waves/W-37-after-lobby-desktop.png`

## Regression class
SPA missing / wrong stack / wrong brand → reopen C-94.
