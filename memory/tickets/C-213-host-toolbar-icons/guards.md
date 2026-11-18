# Guards C-213 — Host board toolbar icons + BoardConfirmModal

## Executable checks
1. `HostBoardToolbar.tsx` renders `.host-board-toolbar` with icon buttons (lock / purge author / clear).
2. CSS: `.host-board-toolbar` is top-centered (`top` + `left: 50%` + `transform: translateX(-50%)`).
3. Destructive / lock actions open `BoardConfirmModal` — **not** `window.confirm` inside whiteboard host tools.
4. `BoardConfirmModal.tsx`: fixed centered backdrop (`.board-confirm-backdrop` flex center) + Vernatun-styled `.board-confirm-card`.
5. Confirm flows cover: toggle board lock, purge selected author, clear board.

## Permanent
- Host board moderation confirms stay in-app modal, centered.

## Regression
- Guest role must not see host toolbar.
- Purge disabled when no `selectedAuthorLabel`.

## Smoke (W-65)
```
# HostBoardToolbar.tsx + BoardConfirmModal.tsx exist
# room.css: .host-board-toolbar left:50%; .board-confirm-backdrop
# no window.confirm in whiteboard HostBoardToolbar / BoardConfirmModal
cd liverooms/web && npx tsc --noEmit
```
