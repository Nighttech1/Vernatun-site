# Guards — C-150 tldraw

1. Room center has `.board-tldraw-stage` + `.tl-container` (no Spacedeck iframe).
2. Toolbar buttons call tools: select / draw / text (`aria-pressed` toggles).
3. Stage width/height fills parent (computed ≈ room-col--center minus chrome).
