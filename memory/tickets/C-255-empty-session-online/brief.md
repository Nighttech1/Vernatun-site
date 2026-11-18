# C-255 Empty session / ghost online (P0)

## Problem
Last participant leaves → session timer keeps running; lobby shows «1 участник».

## Fix
- Grace 20s (was 90s); force clear on rooms poll / vacate / leave webhook
- Webhook accepts numeric LiveKit event enums
- POST `/api/lounge/session/vacate` + FE leave/pagehide
- Sweeper force after grace
