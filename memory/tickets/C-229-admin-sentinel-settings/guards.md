# Guards — W-67 C-224…C-231

## Automated / static
- `npx tsc --noEmit` in `liverooms/web` — pass (2026-09-27)
- `python -c ast.parse(lounge_api.py)` — pass
- CSS: `.legal-gate-disclaimer p { color: #ffffff !important }` present
- No imports of `useFairSpeakingMeter` in `src/`
- VernMsg includes `peer.rename` and `board.sync.*`
- API routes: GET `/api/lounge/sentinel-patterns`, GET/POST `/api/lounge/admin/sentinel-patterns`
- `session_empty_sweeper_loop` started in `main()`

## Manual smoke (Client)
1. LegalGate black box text is white
2. Desktop: drag handle resizes chat 280–560
3. Toolbar grip moves panel
4. Two browsers: rename visible; draw syncs
5. No % meter / construction hints under nick
6. Admin Settings tab saves patterns; password from env
7. Leave last participant → session gone within ~20s
8. ≤10 min banner; at 0 → lobby + wiped chat/board

## Regression class
- Fair meter must not reappear under participant rows
- Empty room must not keep ticking session.json when LiveKit online==0
