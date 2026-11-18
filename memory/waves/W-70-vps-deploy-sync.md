# VPS deploy W-70 — 2026-09-27

## Deployed
- Campus SPA → `campus-app.html` + `/assets/index-Xj6SonG5.js`
- Owner admin → `/home/infinity/vernatun-admin/`
- `lounge_api.py` (C-250 cascade) + service restart
- Data: no wipe (campus-data / bans / evidence kept)
- Backup: `lounge_api.py.bak`, `campus-app.html.bak`

## Sync gate (required)
1. `CAMPUS_URL=https://vernatunspeakclub.com SYNC_ROOM=lozha-erevan` → **PASS**
2. `SYNC_ROOM=bufet-anush` → **PASS**

## URLs
- https://vernatunspeakclub.com/campus
- https://admin.vernatunspeakclub.com/
- API https://vernatunspeakclub.com/api/lounge/rooms
