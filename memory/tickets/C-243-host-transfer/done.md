# C-243 done

## What changed
- Backend: `transfer_host`, `promote_next_host_if_needed`, `/api/lounge/host/transfer`, `/api/lounge/host/ensure`, webhook promote on `participant_left` (completed / kept).
- Frontend: stop reclaiming host from frozen join-time `isHost` after manual transfer.
- Manual transfer UI: participant menu «Сделать ведущим» → `postHostTransfer` + `host.changed` data message.
- Auto: on disconnect, if no host metadata remains → `postHostEnsure` (earliest remaining joiner).

## Files
- `liverooms/infra/vps/lounge_api.py`
- `liverooms/web/src/components/RoomConnected.tsx`
- `liverooms/web/src/components/ParticipantList.tsx` (already wired)
- `liverooms/web/src/api/lounge.ts` (already had endpoints)

## Verify
1. Host A + guest B join → A leaves → B becomes host (mod menu + board tools).
2. Host clicks participant → «Сделать ведущим» → rights move; old host loses mod menu.
