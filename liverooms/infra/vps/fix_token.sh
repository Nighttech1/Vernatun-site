#!/bin/bash
set -euo pipefail
LK="/home/infinity/Vernatun website/livekit"
cd "$LK"
python3 -m venv .venv
.venv/bin/pip install -q livekit-api
sudo tee /etc/systemd/system/vernatun-livekit-token.service > /dev/null <<'EOF'
[Unit]
Description=Vernatun LiveKit token server (test-room)
After=network.target

[Service]
Type=simple
User=infinity
WorkingDirectory=/home/infinity/Vernatun website/livekit
EnvironmentFile=/home/infinity/Vernatun website/livekit/.env
ExecStart=/home/infinity/Vernatun website/livekit/.venv/bin/python /home/infinity/Vernatun website/livekit/token_server.py
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl restart vernatun-livekit-token.service
sleep 2
systemctl is-active vernatun-livekit-token.service || true
systemctl status vernatun-livekit-token.service --no-pager -l | head -40 || true
curl -sf "http://127.0.0.1:8765/token?identity=health&name=health" | head -c 200 || echo "TOKEN_FAIL"
echo
docker ps --format '{{.Names}} {{.Status}}' | grep -E 'livekit|coturn' || true
