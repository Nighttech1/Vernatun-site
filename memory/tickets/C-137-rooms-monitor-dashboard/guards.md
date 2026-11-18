# Guards — C-137 Grafana rooms monitor

## Checks
- [x] `docker compose --profile metrics` includes `grafana` + `prometheus`
- [x] LiveKit `prometheus.port: 6789`; scrape target `livekit:6789`
- [x] Prometheus target job `livekit` = **up**
- [x] Grafana dashboard UID `vernatun-livekit-rooms` provisioned
- [x] visual/after.png — дашборд на http://127.0.0.1:3000
- [x] README infra: URL + admin/admin localhost note

## Note
VPS/prod не трогали. Логин Grafana admin/admin только для localhost.
