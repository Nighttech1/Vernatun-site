# Architect W-64

## C-202
- `docker compose up -d` in `liverooms/infra` (livekit + coturn if defined)
- RoomConnected: map SFU connection failure / unknown disconnect before Connected → `error` leaveReason with RU message, not kicked
- Keep join mutex + grace rejoin

## C-203
- TermsOfServiceModal §8.1 rewrite RU only

## C-204
- LegalGateModal → one checkbox + disclaimer box + terms/privacy links (openPrivacyPolicy)
- Keep postLegalConsent API

## C-205–207
- VernatunWhiteboard: sideEffects beforeCreate meta; user.updateUserPreferences
- HostBoardToolbar in RoomConnected when isHost
- Broadcast board.lock / board.clear / board.purgeAuthor via vern data channel
- Report: exportToBlob png + getSnapshot → postReport board_png_b64 + board_state_json
- Backend save_evidence_blob stores both; no stroke logging

## C-208
- Admin custom select CSS; purge dropdown; checkboxes; hide detail-raw for reports; seed 3 mock reports via POST admin/inbox/seed-mocks or append on first load if empty flag
