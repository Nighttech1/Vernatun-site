# Guards C-223 — Drawing tools hover: color / size popover

## Executable checks
1. Draw tools (`draw` / `highlight` / eraser set): desktop hover opens `.wb-draw-style-pop` with color swatches + size buttons (`CustomToolbar.tsx`).
2. Tap/click draw tool also `setStyleOpen(true)` — mobile must not rely on hover alone.
3. Do not reintroduce full tldraw StylePanel chrome.
4. Popover rows: `aria-label="Цвет"` and `aria-label="Размер"`.

## Permanent
- Color + size remain reachable from Vernatun toolbar language.

## Regression
- At ≤412px, host board toolbar must not cover draw tools (blocks popover open) — see C-216.

## Smoke (W-66)
```
# Code: openStyleSoon on pointerenter; runTool(draw) → setStyleOpen(true)
# Runtime mobile: Карандаш click intercepted by host-board-toolbar (C-216 overlap)
```

## Verdict W-66 Tester
**PASS (code) / BLOCKED (mobile runtime)** — popover + tap affordance present in source; mobile tap path blocked by host toolbar overlap (C-216). Treat wave as needs Fixer for overlap before Client mobile accept.
