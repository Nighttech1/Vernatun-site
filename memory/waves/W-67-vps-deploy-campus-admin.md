# W-67 — VPS deploy: main+Campus SPA + admin subdomain

**Дата:** 2026-09-27  
**Gate:** явное «поехали деплой» от владельца.

## Цель

1. `https://vernatunspeakclub.com` — лендинг + аккуратно вшитый React **Кампус** (`/campus`, `/room`)
2. `https://admin.vernatunspeakclub.com` — ЛК владельца
3. `lounge_api` обновлён, данные не wipe

## Chain

```
Архитектор → Деплоер → Тестировщик (smoke URL) → Клиент
```

## Шаги Деплоера

1. Nginx: locations `/campus` `/room` `/lounge` → `campus-app.html`; не трогать marketing `index.html`
2. `npm run build` → copy `dist` assets + `campus-app.html`
3. Deploy marketing via existing script (SkipSsl if certs OK)
4. SCP admin → `/home/infinity/vernatun-admin`
5. SCP `lounge_api.py` → livekit/; `systemctl restart vernatun-lounge-api` (env paths unchanged)
6. nginx -t && reload
7. Smoke both HTTPS URLs + `/api/lounge/rooms`

## Результат 2026-09-27

| URL | Status |
|-----|--------|
| https://vernatunspeakclub.com/ | 200 marketing |
| https://vernatunspeakclub.com/campus | 200 React SPA (rooms live) |
| https://vernatunspeakclub.com/room | 200 SPA shell |
| https://vernatunspeakclub.com/api/lounge/rooms | 200 |
| https://admin.vernatunspeakclub.com/ | 200 Owner LK |

Note: after `install_on_vps.sh` / certbot, keep **one** enabled site (`vernatunspeakclub.com`), remove duplicate `vernatunspeakclub.com.conf` symlink to avoid conflicting server_name.
