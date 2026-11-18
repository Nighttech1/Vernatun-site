# Vernatun — Selectel deployment

Production: https://vernatunspeakclub.com, https://admin.vernatunspeakclub.com (also HTTPS :86); marketing HTTP :85. API binds only 127.0.0.1:8765.

Server: root@176.53.250.26; SSH key configured in ignored `vps door/set-vernatun-ssh-env.local.ps1`.

Run from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy_selectel_to_vps.ps1
```

The marketing and campus deploy entrypoints call this script. A new immutable release is staged under `/opt/vernatun-web/releases`, then `/opt/vernatun-web/current` switches atomically. No server environment or runtime data is uploaded by updates. Existing `/etc/vernatun-web` and `/var/lib/vernatun-web` are backed up before the switch to `/var/backups/vernatun-web/<timestamp>`; the previous release path is recorded there. Retain old releases for rollback.

- `/etc/vernatun-web/lounge.env`: production API credentials and data paths.
- `/var/lib/vernatun-web/livekit`: inbox, chat, runtime logs, room catalog.
- `/var/lib/vernatun-web/campus-data`: user materials and moderation data.
- `/opt/vernatun-web/venv`: Python dependencies.
- `vernatun-lounge-api.service`: enabled systemd API.
- `/opt/vernatun-web/rtc/compose.yaml`: LiveKit and coturn, restart unless-stopped.
- `/etc/vernatun-web/livekit.yaml` and `turnserver.conf`: generated production RTC settings.
- `/var/backups/vernatun-web/vernatun-web-local-snapshot.tgz`: original local import.
- `/var/backups/vernatun-web/vernatun-spacedeck-preserved.tgz`: preserved legacy board sources, SQLite and media. Current board UI uses tldraw, so a separate Spacedeck container is not started.

The local September snapshot was accepted by the owner as current because the old VPS is dead. Initial bootstrap scripts are one-time migration tools; never rerun them to update data. The API bootstrap refuses to replace an existing environment. Do not use legacy nginx configs that contain `/home/infinity` paths.

Nginx active configuration: `/etc/nginx/sites-available/vernatun-web.conf`, local reference: `vps door/Vernatun website/nginx/selectel-vernatun.conf`. Certbot renewal timer is enabled. The certificate covers apex and admin; www still points to the old IP and needs its DNS A record changed to 176.53.250.26 before adding it to the certificate.

Checks completed on 2026-11-08: production build; marketing/campus/admin HTTP200; HTTPS trust; API rooms JSON; original inbox available; one temporary admin record was written, survived API restart, then removed by its exact ID; all existing records preserved. LiveKit/coturn containers and HTTP signaling health passed. Real two-device audio/video and NAT relay quality require a browser media session and were not validated by an HTTP probe.

Local marketing dev server:

```powershell
$env:HOST='127.0.0.1'; $env:PORT='8085'; python scripts/dev_server.py
```

For campus development use `npm run dev` under `liverooms/web`; it expects an API proxy target as configured in `.env.local`.
