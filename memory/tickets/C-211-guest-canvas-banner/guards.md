# Guards C-211 — Guest canvas banner taller; no license watermark line

## Executable checks
1. `BoardPanel.tsx` renders `.board-guest-canvas-banner` with title «Гостевой холст участников».
2. Banner CSS (`.board-guest-canvas-banner` in `room.css`) has elevated height vs thin strip: `min-height` ≥ `3.5rem` and/or padding ≥ `0.85rem` vertical.
3. Banner must **not** show watermark / license instructional text such as:
   - `Вы: Noname`
   - `watermark`
   - `license` / «нужен license» as visible banner copy.
4. tldraw commercial watermark still solved via `licenseKey` prop (env `VITE_TLDRAW_LICENSE_KEY`) — not by CSS hide (see C-153).

## Permanent
- Guest banner is the tall branded strip with only the guest-canvas title (+ optional 18+ brush note).

## Regression
- C-153: do not CSS-hide tldraw license watermark; keep `licenseKey` path.

## Smoke (W-65)
```
# BoardPanel.tsx: Гостевой холст участников
# room.css: .board-guest-canvas-banner min-height
cd liverooms/web && npx tsc --noEmit
```
