# Guards C-170 — Legal 18+ gate

## Executable checks
1. `GET /api/lounge/token?client_id=NEW` without prior consent → **403** `legal_consent_required`
2. `POST /api/lounge/legal/consent` with both flags true → 200 + append `legal_consent.log`
3. UI: without `vernatun-legal-consent-v1` localStorage → `LegalGateModal` blocks connect; CTA disabled until both checkboxes

## Permanent
- Gate mounts before LiveKitRoom connect in `RoomPage.tsx`
- Append-only consent log under `LOUNGE_CAMPUS_DATA` / `legal_consent.log`

## Regression
AI consent (C-144) remains separate; legal gate is for room entry, not AI coach.
