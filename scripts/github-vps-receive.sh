#!/usr/bin/env bash
# Installed once at /opt/vernatun-web/github-receive.sh by the server owner.
# A dedicated SSH key is restricted to this command in authorized_keys.
set -euo pipefail
[ "${SSH_ORIGINAL_COMMAND:-}" = deploy ] || { echo 'Only deployment is permitted' >&2; exit 1; }
exec 9>/opt/vernatun-web/github-deploy.lock
flock -w 600 9
stamp=$(date -u +%Y%m%d%H%M%S)
archive="/opt/vernatun-web/release-$stamp.tgz"
cat > "$archive"
tar -tzf "$archive" > /dev/null
bash /opt/vernatun-web/release.sh "$stamp"
for attempt in {1..10}; do
  if curl -fsS http://127.0.0.1:8765/api/lounge/rooms > /dev/null; then
    echo "Deployed release $stamp"
    cat /opt/vernatun-web/current/REVISION
    exit 0
  fi
  sleep 2
done
echo 'API health check failed' >&2
exit 1
