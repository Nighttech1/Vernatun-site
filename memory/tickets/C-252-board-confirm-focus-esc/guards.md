# Guards C-252 / C-253

## C-252
- BoardConfirmModal uses `createPortal(..., document.body)`
- Escape calls onCancel (capture phase)
- Focus moves to Отмена on open
- backdrop z-index ≥ 10050, pointer-events auto

## C-253
- HostBoardToolbar = `.wb-toolbar-island` horizontal + grip
- `clampToolbarPos` used by HostBoardToolbar + CustomToolbar
- Cannot drag outside offsetParent (board wrap)

## Build
- `npx tsc --noEmit` pass
