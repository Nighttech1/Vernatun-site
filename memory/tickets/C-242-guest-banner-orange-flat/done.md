# C-242 done

## What changed
- Guest label moved onto the board canvas stack as an absolute overlay (not a flex strip on `#e8eef4`).
- Flat terracotta text `#c95b36` only — no background / border / radius / shadow / plate.
- Mobile banner `min-height` plate removed.

## Files
- `liverooms/web/src/components/BoardPanel.tsx`
- `liverooms/web/src/styles/room.css`

## Verify
- Open room board: «Гостевой холст участников» sits on the canvas, orange, no blue bar/chip.
