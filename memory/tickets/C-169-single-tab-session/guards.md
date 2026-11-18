# Guards C-169 — single tab + session mutex

## Executable checks
1. Unit/API: second token for same `client_id`+room triggers `enforce_single_session` (LiveKit remove old identity) — covered by Backend helper + smoke join.
2. Manual/UI: open `/room?room=mansarda` in two tabs → second shows `.legal-gate` / duplicate overlay (`.tab-duplicate-overlay` / class from RoomPage) and does not start LiveKit.

## Permanent assertions
- `useSingleTabEnforcer` exists under `liverooms/web/src/hooks/useSingleTabEnforcer.ts`
- Channel name pattern `campus_tab_bus_${roomId}`
- Token path registers active session after legal consent

## Regression
Do not remove BroadcastChannel enforcer when changing RoomPage join flow.
