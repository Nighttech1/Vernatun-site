#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT
mkdir -p "$stage/web" "$stage/admin" "$stage/api"
for item in index.html schedule.html about.html articles.html materials.html contacts.html test-room.html lounge.html room.html favicon.ico robots.txt sitemap.xml images gallery css js fonts articles materials videos; do
  if [ -e "$item" ]; then cp -a "$item" "$stage/web/"; fi
done
cp liverooms/web/dist/index.html "$stage/web/campus-app.html"
cp -a liverooms/web/dist/assets "$stage/web/"
for item in index.html app.js styles.css; do cp "liverooms/admin/$item" "$stage/admin/"; done
for item in lounge_api.py spacedeck_client.py calendar_feed.py; do cp "liverooms/infra/vps/$item" "$stage/api/"; done
printf '%s\n' "${GITHUB_SHA:-$(git rev-parse HEAD)}" > "$stage/REVISION"
tar --exclude='*.MOV' --exclude='*.mov' -czf release.tgz -C "$stage" .

