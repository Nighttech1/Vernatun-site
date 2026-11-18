# C-255 guards

1. Leave alone from room → within ~3s lobby shows online=0 and session_active=false for that room.
2. POST `/api/lounge/session/vacate` with `force_empty:true` ends session even if LiveKit had a ghost.
3. GET `/api/lounge/rooms` must not keep session_active when LiveKit online=0.
