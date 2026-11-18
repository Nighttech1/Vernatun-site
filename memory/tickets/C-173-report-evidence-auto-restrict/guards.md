# Guards C-173 — report evidence + auto-restrict

## Executable checks
1. Report accepts `reason_code` in {POLITICAL_EXTREMISM, NSFW_CANVAS, OFFENSIVE_VOICE, FLOOD_SPAM}
2. ≥3 distinct `reporter_client_id` on same room+target_client_id → `auto_restricted: true` + GET `/api/lounge/restrictions` shows mic/board blocks
3. ReportDialog UI requires reason + body ≥10 chars
4. Evidence optional (chat snapshot / jpeg); missing audio must not fail report

## Permanent
- Append-only reports.log + evidence under campus-data/evidence/
- Host mute/kick (C-161) still works independently

## Regression
Cannot report self; trust penalty on target_client_id preserved.
