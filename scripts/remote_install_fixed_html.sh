#!/bin/bash
set -euo pipefail
WEB="/home/infinity/Vernatun website/web"
cp /tmp/vernatun_fix_index.html "$WEB/index.html"
cp /tmp/vernatun_fix_about.html "$WEB/about.html"
cp /tmp/vernatun_fix_contacts.html "$WEB/contacts.html"
cp /tmp/vernatun_fix_schedule.html "$WEB/schedule.html"
cp /tmp/vernatun_fix_materials.html "$WEB/materials.html"
cp /tmp/vernatun_fix_articles.html "$WEB/articles.html"
mkdir -p "$WEB/articles" "$WEB/materials/podcasts/ideal-life"
cp /tmp/vernatun_fix_articles_esli-stesnyaeshsya.html "$WEB/articles/esli-stesnyaeshsya.html"
cp /tmp/vernatun_fix_articles_kak-prohodit-vstrecha.html "$WEB/articles/kak-prohodit-vstrecha.html"
cp /tmp/vernatun_fix_articles_kakoi-armyanskii.html "$WEB/articles/kakoi-armyanskii.html"
cp /tmp/vernatun_fix_materials_podcasts_ideal-life_index.html "$WEB/materials/podcasts/ideal-life/index.html"
python3 <<'PY'
t=open("/home/infinity/Vernatun website/web/index.html", encoding="utf-8").read()
print("VPS", "О нашем клубе" in t, "Рћ" not in t[:3000], "Дом" in t)
PY
