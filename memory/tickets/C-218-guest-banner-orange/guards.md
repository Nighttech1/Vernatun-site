# Guards C-218 — Guest canvas banner: orange on white

## Executable checks
1. `.board-guest-canvas-banner` computed `background` is white (`rgb(255, 255, 255)`), not slate→azure gradient.
2. `.board-guest-canvas-title` color orange (`#c95b36` / `rgb(201, 91, 54)`).
3. Copy remains «Гостевой холст участников».
4. Visual: room board top strip after-shot (`memory/waves/W-66-shots/room-iphone-390.png` / desktop board).

## Permanent
- No navy/azure hatch fill on guest banner; orange text on white only.

## Regression
- Do not restore blue gradient / hatch from C-211 era.

## Smoke (W-66)
```
# evaluate: guestBg white, guestColor rgb(201,91,54), text «Гостевой холст участников»
```

## Verdict W-66 Tester
**PASS**
