# Architect-spec — Owner Admin on VPS

## Goal
Serve `liverooms/admin/` at `admin.vernatunspeakclub.com` with SSL; also listen **86**.

## Layout
- Files: `/home/infinity/Vernatun website/admin/`
- Nginx site: `/etc/nginx/sites-available/admin.vernatunspeakclub.com`
- `listen 80` → ACME + redirect HTTPS
- `listen 443 ssl` + `listen 86 ssl` (same root)
- `location /api/lounge/` → `http://127.0.0.1:8765` (strip or pass full path — API accepts both `/api/lounge/...` and short paths; use proxy_pass http://127.0.0.1:8765 with URI preserved)

## Cert
`certbot --nginx -d admin.vernatunspeakclub.com` (non-interactive if possible)

## Access
- https://admin.vernatunspeakclub.com/
- https://admin.vernatunspeakclub.com:86/

## Chain
Deployer → Tester smoke → Client note
