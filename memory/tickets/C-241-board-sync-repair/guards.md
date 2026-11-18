# Guards — C-241 board sync

## Automated
- `node scripts/board-sync-smoke.mjs` (room `lozha-erevan`) — **PASS** ×3 (2026-09-27)
  - Evidence: `PASS: board sync { beforeB: 0, afterB: 1, afterA: 1 }`
- Root cause fixed:
  1. Offline BoardPanel without LiveKit session removed (`RoomPage`)
  2. LiveKit `node_ip: 127.0.0.1` (Docker ICE was advertising 172.20.0.x → short ICE)
  3. `publishVernMsg` waits for publisher ICE before first `publishData` (avoids poisoning livekit-client `publisherConnectionPromise`)
  4. Empty-session sweeper 90s grace after `startedAt`

## Manual
- Two real browsers: draw on A → shape appears on B
- Guest label orange flat (C-242)
- Host leave → 2nd joiner gets host (C-243)
