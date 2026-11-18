# Done — C-241 board sync

PASS: dual-peer Playwright smoke (`scripts/board-sync-smoke.mjs`).

Fixes shipped:
- No local-only board without LiveKit session
- LiveKit `node_ip: 127.0.0.1`
- Data publish gated on publisher ICE ready
- Session empty sweeper grace 90s
