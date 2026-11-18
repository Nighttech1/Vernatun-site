# Guards C-168
- POST `/api/lounge/rooms` → 403 `create_disabled`
- No `.campus-create-card` in lobby
- Storage: `LOUNGE_CAMPUS_DATA` → `rooms/<id>/chat.json|session.json|uploads/`
  - local: `liverooms/campus-data/`
  - VPS later: `/var/www/vernatun/campus`
