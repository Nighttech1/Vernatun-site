# Guards C-220 — Board lock: no confirm + blue active outline

## Executable checks
1. Lock button calls `onToggleLock()` directly — no `BoardConfirmModal` for lock (`HostBoardToolbar.tsx`).
2. Purge/clear still use confirm modals.
3. Locked state: `host-board-icon-btn is-active`, `aria-pressed=true`, label «Просмотр».
4. Active outline blue: border/box-shadow `#2a5a84` / `rgb(42, 90, 132)`.
5. DC `board.lock` behaviour unchanged.

## Permanent
- One-click lock/unlock; blue active affordance required.

## Regression
- Do not reintroduce confirm dialog for lock only.

## Smoke (W-66)
```
# Playwright click «Блок доски» → «Просмотр», confirmOpen=false, borderColor rgb(42,90,132)
# Shot: memory/waves/W-66-shots/board-lock-android-412.png
```

## Verdict W-66 Tester
**PASS**
