#!/bin/bash
set -euo pipefail
stamp="$1"
[[ "$stamp" =~ ^[0-9]{14}$ ]] || exit 2
app=/opt/vernatun-web
backup=/var/backups/vernatun-web/$stamp
mkdir -p "$backup" "$app/releases/$stamp"
if [ -L "$app/current" ]; then readlink "$app/current" > "$backup/previous-release"; fi
for path in /etc/vernatun-web /var/lib/vernatun-web; do
  [ ! -d "$path" ] || tar -czf "$backup/$(basename "$path")-$(basename "$(dirname "$path")").tgz" "$path" 2>/dev/null
done
tar -xzf "$app/release-$stamp.tgz" -C "$app/releases/$stamp"
chmod -R a+rX "$app/releases/$stamp"
ln -sfn "$app/releases/$stamp" "$app/current-next"
mv -Tf "$app/current-next" "$app/current"
ln -sfn "$app/current/web" /var/www/vernatunspeakclub.com
ln -sfn "$app/current/admin" /var/www/vernatun-admin
if systemctl is-active --quiet vernatun-lounge-api.service; then systemctl restart vernatun-lounge-api.service; fi
nginx -t
systemctl reload nginx
curl -fsSI http://127.0.0.1:85/ | head -3
