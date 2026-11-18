#!/bin/bash
set -euo pipefail
mkdir -p /opt/vernatun-web/rtc
python3 - <<'PY'
from pathlib import Path
import secrets
v={}
for l in Path('/etc/vernatun-web/lounge.env').read_text().splitlines():
 if '=' in l:
  k,x=l.split('=',1); v[k]=x
turn=secrets.token_hex(24)
p=Path('/etc/vernatun-web')
p.joinpath('livekit.yaml').write_text('''port: 7880
bind_addresses: ["0.0.0.0"]
rtc:
  tcp_port: 7881
  udp_port: 7882
  use_external_ip: false
  node_ip: 176.53.250.26
  turn_servers:
    - host: vernatunspeakclub.com
      port: 3478
      protocol: udp
      username: vernatun
      credential: "'''+turn+'''"
logging:
  level: info
webhook:
  api_key: '''+v['LIVEKIT_API_KEY']+'''
  urls: ["http://127.0.0.1:8765/api/lounge/webhooks/livekit"]
keys:
  '''+v['LIVEKIT_API_KEY']+''': "'''+v['LIVEKIT_API_SECRET']+'''"
''')
p.joinpath('turnserver.conf').write_text('listening-port=3478\nfingerprint\nlt-cred-mech\nrealm=vernatunspeakclub.com\nuser=vernatun:'+turn+'\nno-cli\nno-tls\nno-dtls\nmin-port=49160\nmax-port=49200\nexternal-ip=176.53.250.26\nno-multicast-peers\n')
PY
chmod 600 /etc/vernatun-web/livekit.yaml /etc/vernatun-web/turnserver.conf
cat > /opt/vernatun-web/rtc/compose.yaml <<'YAML'
name: vernatun-rtc
services:
  livekit:
    image: livekit/livekit-server:v1.13.4
    restart: unless-stopped
    network_mode: host
    command: --config /etc/livekit.yaml
    volumes:
      - /etc/vernatun-web/livekit.yaml:/etc/livekit.yaml:ro
  coturn:
    image: coturn/coturn:4.6.2-alpine
    restart: unless-stopped
    network_mode: host
    command: ["-c", "/etc/coturn/turnserver.conf"]
    volumes:
      - /etc/vernatun-web/turnserver.conf:/etc/coturn/turnserver.conf:ro
YAML
systemctl enable --now docker
cd /opt/vernatun-web/rtc
docker compose up -d
