#!/bin/bash
set -euo pipefail
LK="/home/infinity/Vernatun website/livekit"
PWD_VAL="$1"
cd "$LK"

# capture livekit keys from old process if still up
OLD_PID=$(pgrep -f 'python ./lounge_api.py' | head -1 || true)
if [ -n "${OLD_PID:-}" ] && [ -r "/proc/$OLD_PID/environ" ]; then
  tr '\0' '\n' < "/proc/$OLD_PID/environ" | grep -E '^LIVEKIT_API_KEY=|^LIVEKIT_API_SECRET=|^LIVEKIT_PUBLIC_URL=|^LIVEKIT_HTTP_URL=' > /tmp/lk.env || true
else
  touch /tmp/lk.env
fi

{
  echo "LOUNGE_OWNER_PASSWORD=${PWD_VAL}"
  echo "MEET_BIND=127.0.0.1"
  echo "MEET_PORT=8765"
  echo "LOUNGE_ROOMS_PATH=${LK}/rooms.json"
  echo "LOUNGE_CHAT_DIR=${LK}/chat"
  echo "LOUNGE_INBOX_PATH=${LK}/owner_inbox.jsonl"
  echo "LOUNGE_TRUST_PATH=${LK}/trust.json"
  echo "LOUNGE_REPORT_LOG=${LK}/reports.log"
  echo "LOUNGE_MOD_LOG=${LK}/moderation.log"
  echo "LOUNGE_WEBHOOK_LOG=${LK}/webhooks.log"
  echo "LOUNGE_ROOMS_DYNAMIC_PATH=${LK}/rooms_dynamic.json"
  if grep -q '^LIVEKIT_API_KEY=' /tmp/lk.env; then
    cat /tmp/lk.env
  else
    # fallback from token service env if any
    echo "LIVEKIT_HTTP_URL=http://127.0.0.1:7880"
    echo "LIVEKIT_PUBLIC_URL=wss://vernatunspeakclub.com"
  fi
} > "${LK}/lounge-owner.env"
chmod 600 "${LK}/lounge-owner.env"

# ensure keys exist
if ! grep -q '^LIVEKIT_API_KEY=' "${LK}/lounge-owner.env"; then
  echo "ERROR: LIVEKIT_API_KEY missing" >&2
  exit 1
fi

sudo tee /etc/systemd/system/vernatun-lounge-api.service > /dev/null <<EOF
[Unit]
Description=Vernatun Lounge API (rooms, tokens, owner inbox)
After=network.target

[Service]
Type=simple
User=infinity
WorkingDirectory=${LK}
EnvironmentFile=${LK}/lounge-owner.env
ExecStart=${LK}/.venv/bin/python ./lounge_api.py
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

if [ -n "${OLD_PID:-}" ]; then
  sudo kill "$OLD_PID" || true
  sleep 1
fi
sudo systemctl daemon-reload
sudo systemctl enable --now vernatun-lounge-api.service
sleep 2
sudo systemctl --no-pager --full status vernatun-lounge-api.service | head -25
curl -s http://127.0.0.1:8765/
echo
curl -s -o /dev/null -w "inbox:%{http_code}\n" -H "X-Owner-Password: ${PWD_VAL}" http://127.0.0.1:8765/api/lounge/admin/inbox
