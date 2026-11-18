# Guards W-70

## C-248
- `.host-board-toolbar-overlay` present in VernatunWhiteboard (host only)
- CSS: overlay `background: transparent`, no border strip
- Buttons below guest label (`top: 2.15rem`)

## C-249
- VocabCardShape: no badge when `dialect === 'common'`

## C-250
- `promote_next_host_if_needed` cascade + departed filter
- FE: ensure retries 350/1200/2500ms on ParticipantDisconnected
- `ast.parse(lounge_api.py)` ok

## C-251
- ReportDialog uses `VernatunSelect` (not native select popup)
- Panel width matches trigger (±2px) — verified Playwright
- `border-radius: 12px` on panel

## Build
- `npx tsc --noEmit` — pass
- localhost API restarted
