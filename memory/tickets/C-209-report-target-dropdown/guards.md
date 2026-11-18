# Guards C-209 — Report target dropdown + full reason list

## Executable checks
1. `ParticipantList.tsx` contains **no** button/label `Жалоба` (per-nick report removed).
2. Room-level CTA `Пожаловаться` opens `ReportDialog` (`RoomConnected.tsx`).
3. `ReportDialog.tsx` has select `#report-target` labelled «На кого» with:
   - option «Проблема комнаты / без конкретного лица» (`ROOM_OPTION` / `roomLevel: true`);
   - one `<option>` per peer in `peers`.
4. `#report-reason` lists full `REASON_OPTIONS` (≥8 codes): HARASSMENT, OFFENSIVE_VOICE, DISCRIMINATION, POLITICAL_EXTREMISM, EXTREMISM, NSFW_CANVAS, FLOOD_SPAM, NOISE_TROLLING, BOARD_SABOTAGE, ILLEGAL_CONTENT.
5. Backend `REASON_CODES` in `liverooms/infra/vps/lounge_api.py` matches frontend `ReportReasonCode` in `api/lounge.ts` (same set).
6. Submit payload includes `reasonCode` + either `roomLevel` or `targetIdentity`/`targetClientId`.

## Permanent
- No per-participant «Жалоба» in participant rows; report only via dialog with target dropdown.

## Regression
- Cannot weaken to fewer reason codes than оферта §6 list above.
- Self must not appear in target peers list.

## Smoke (W-65)
```
cd liverooms/web && npx tsc --noEmit
# grep: На кого, REASON_OPTIONS, Проблемы комнаты — ReportDialog.tsx
# grep -L Жалоба ParticipantList.tsx → no match for Жалоба
```
