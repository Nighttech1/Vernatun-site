# Guards C-219 — Author labels: flash + local select only

## Executable checks
1. On local create: chip flashes ~1.2s (`FLASH_MS`), then hides (`ShapeAuthorLabels.tsx`).
2. On select: chip only for shapes where `meta.createdBy` / identity === **local** user (multi-select of local OK).
3. Chip text color `#fff` (inline + `.shape-author-chip`).
4. Labels are local overlay only — do not broadcast visibility over DC.
5. No always-on nick labels on all shapes (C-212 shield relaxed).

## Permanent
- Selection-driven labels must stay local-only; peers must not see foreign selection chips.

## Regression
- Selecting a peer’s shape must **not** show that peer’s nick chip on the selector’s client (filter by local identity).

## Smoke (W-66)
```
# Code: FLASH_MS=1200; color #fff; overlay local
# Gap: select path pushLabel(selected) without createdBy===local filter → FAIL
```

## Verdict W-66 Tester
**FAIL** — flash + white chip + no always-on present, but select shows chip for **any** selected shape with nickname (no local `createdBy` filter).
