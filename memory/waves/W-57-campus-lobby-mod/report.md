# W-57 report

## Done
- FE: host/mute/chat/board SVG icons; onlineCount fix; createRoom removed; lobby UX; site chrome
- BE: seed-only catalog; POST create 403; campus-data dirs + README; first=host unchanged
- Tester: lobby.spec 2/2 green
- Fixer: test strict-mode; API restart with .env; cleared accidental rooms_dynamic test row
- Deployer: Vite :5173 + lounge_api :8765 localhost (no VPS)

## Localhost
- Campus: http://127.0.0.1:5173/campus
- Site sections via same origin: /about /schedule /materials /articles /contacts
- API: http://127.0.0.1:8765/

## Storage
Local `liverooms/campus-data/rooms/<id>/` · VPS later `/var/www/vernatun/campus`
