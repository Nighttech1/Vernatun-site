# Guards C-216 — Mobile room QA (iPhone + Android)

## Executable checks
1. Playwright viewport **390×844** (iPhone) and **412×915** (Android) on `http://127.0.0.1:5173/room?room=…` after LegalGate.
2. Assert document-level H-scroll: `document.documentElement.scrollWidth <= clientWidth` (+1px tolerance).
3. Primary CTAs visible in viewport: mic (`Микрофон`), leave/rooms, mobile tabs (Участники / Доска / Чат).
4. After-shots required (DOM-only ≠ close): `memory/waves/W-66-shots/room-iphone-390.png`, `room-android-412.png`.

## Permanent
- `@media (max-width: 768px)` in `room.css` keeps `overflow-x: hidden` / `max-width: 100vw` on room shell.
- Mobile tab strip remains the primary navigation; board/host chrome must not force page H-scroll.

## Regression
- Host board toolbar must not intercept pointer events over draw toolbar tools (pencil/highlight) at ≤412px — overlap = FAIL even if scrollWidth is OK.
- Do not reopen document-level horizontal scroll when adding toolbar buttons.

## Smoke (W-66)
```
# Playwright: resize 390 + 412 → scrollWidth <= clientWidth
# Shots: memory/waves/W-66-shots/room-iphone-390.png, room-android-412.png
# Finding W-66: host-board-toolbar overlaps wb-tool-btn (Карандаш click intercepted)
```

## Verdict W-66 Tester
**FAIL** — H-scroll OK and mic reachable; host moderation toolbar overlaps Vernatun draw toolbar on mobile so board tools are not reliably tappable.
