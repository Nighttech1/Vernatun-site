# Guards — C-148 purge

1. `purge_board(room)` removes map entry + calls DELETE Space + wipes `storage/**/s{id}*`.
2. Triggered from `maybe_clear_chat` only when `livekit_online == 0` (not on API None).
3. Hint on `/api/lounge/board` mentions immediate delete on empty room.
