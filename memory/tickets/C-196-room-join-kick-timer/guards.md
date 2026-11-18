# Guards W-63

## C-196
- Join mutex: module `joinInflight` in RoomPage — StrictMode double mount does not issue two tokens.
- Grace rejoin once within 6s on kicked/superseded — no false lifecycle kick on SESSION_OVERRIDE race.
- Build: `npm run build` green (web).

## C-197
- `.campus-main` padding-top 4rem / sm 5rem (pt-16 / sm:pt-20).

## C-198
- Featured label «Популярное»; `.is-on-air` red pulse when online > 0.

## C-199 / C-200
- Admin shell padding 0.625rem; list 2-col grid; list-scroll ~8 rows; evidence GET; delete/purge POST with `.bak` before rewrite.
- ReportDialog file input → `extra_jpeg_b64`.

## C-201
- Terms + Privacy modals: full edition 27.09.2026 structured HTML.

## Regression
- Do not start empty-data wipe of inbox without owner password + confirm.
- Ban list: no mass delete (lift only).
