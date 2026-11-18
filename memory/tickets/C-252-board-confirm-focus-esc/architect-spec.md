# Spec W-71 — C-252 / C-253

## C-252 BoardConfirmModal
Root cause: modal rendered under `.host-board-toolbar-overlay { pointer-events: none }` → clicks fall through to tldraw.
- Portal modal to `document.body` OR `pointer-events: auto` on backdrop + high z-index
- On open: focus primary/cancel button; trap focus lightly
- Escape → onCancel
- stopPropagation on card pointer events

## C-253 Host toolbar = horizontal island like vertical tools
- Style: `.wb-toolbar-island` horizontal (small icon buttons ~2.25rem, grip)
- Draggable within `.board-tldraw-canvas-wrap` only
- Clamp both host dock AND CustomToolbar: `x in [8, pw-w-8]`, `y in [8, ph-h-8]` using measured size
- Persist host pos in localStorage `vernatun-wb-hostbar:{roomId}`

## chain
1. Frontend
2. Tester
3. Fixer
4. Deployer localhost
5. Client
