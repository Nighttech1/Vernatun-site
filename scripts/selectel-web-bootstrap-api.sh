#!/bin/bash
set -euo pipefail
app=/opt/vernatun-web
source=/var/lib/vernatun-web/import-local-20261108
if [ -f /etc/vernatun-web/lounge.env ]; then echo "API already initialized; refusing to replace working data. Use release deploy." >&2; exit 1; fi
backup=/var/backups/vernatun-web/api-bootstrap-$(date +%Y%m%d%H%M%S)
mkdir -p "$backup" /var/lib/vernatun-web/livekit /var/lib/vernatun-web/campus-data /etc/vernatun-web
id vernatun-web >/dev/null 2>&1 || useradd --system --home /var/lib/vernatun-web --shell /usr/sbin/nologin vernatun-web
tar -czf "$backup/data-before.tgz" /var/lib/vernatun-web/livekit /var/lib/vernatun-web/campus-data /etc/vernatun-web 2>/dev/null
cp -a "$source/infra/vps/." /var/lib/vernatun-web/livekit/
cp -a "$source/campus-data/." /var/lib/vernatun-web/campus-data/
cp -a "$source/ai" /var/lib/vernatun-web/
python3 - <<'PY'
from pathlib import Path
root=Path('/var/lib/vernatun-web')
values={}
for line in (root/'import-local-20261108/infra/.env').read_text(encoding='utf-8-sig').splitlines():
 if '=' in line and not line.lstrip().startswith('#'):
  k,v=line.split('=',1); values[k.strip()]=v.strip().strip('"').strip("'")
values.update(MEET_BIND='127.0.0.1',MEET_PORT='8765',LIVEKIT_HTTP_URL='http://127.0.0.1:7880',LIVEKIT_PUBLIC_URL='wss://vernatunspeakclub.com')
paths={'LOUNGE_ROOMS_PATH':'rooms.json','LOUNGE_ROOMS_DYNAMIC_PATH':'rooms_dynamic.json','LOUNGE_CHAT_DIR':'chat','LOUNGE_INBOX_PATH':'owner_inbox.jsonl','LOUNGE_TRUST_PATH':'trust.json','LOUNGE_REPORT_LOG':'reports.log','LOUNGE_MOD_LOG':'moderation.log','LOUNGE_WEBHOOK_LOG':'webhooks.log','LOUNGE_SESSION_DIR':'sessions','LOUNGE_ESCALATION_LOG':'escalation.log','LOUNGE_AI_CONSENT_LOG':'ai_consent.log','LOUNGE_BOARD_MAP_PATH':'board_spaces.json'}
for k,v in paths.items(): values[k]=str(root/'livekit'/v)
values['LOUNGE_CAMPUS_DATA']=str(root/'campus-data')
values['LOUNGE_AI_PROMPTS_DIR']=str(root/'ai/prompts')
Path('/etc/vernatun-web/lounge.env').write_text('\n'.join(f'{k}={v}' for k,v in values.items())+'\n')
PY
chmod 600 /etc/vernatun-web/lounge.env
chown -R vernatun-web:vernatun-web /var/lib/vernatun-web/livekit /var/lib/vernatun-web/campus-data /var/lib/vernatun-web/ai
python3 -m venv "$app/venv"
"$app/venv/bin/pip" install livekit-api
cat > /etc/systemd/system/vernatun-lounge-api.service <<'UNIT'
[Unit]
Description=Vernatun Lounge API
After=network-online.target
Wants=network-online.target
[Service]
Type=simple
User=vernatun-web
Group=vernatun-web
WorkingDirectory=/var/lib/vernatun-web/livekit
EnvironmentFile=/etc/vernatun-web/lounge.env
ExecStart=/opt/vernatun-web/venv/bin/python /opt/vernatun-web/current/api/lounge_api.py
Restart=always
RestartSec=5
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now vernatun-lounge-api.service
sleep 2
systemctl is-active vernatun-lounge-api.service
curl -fsS http://127.0.0.1:8765/api/lounge/rooms > /tmp/vernatun-rooms-check.json
python3 - <<'PY'
import json
x=json.load(open('/tmp/vernatun-rooms-check.json')); print('rooms API JSON parsed:',type(x).__name__)
PY

