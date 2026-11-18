# Guards — C-132 Prometheus

1. `liverooms/infra/prometheus/prometheus.yml` scrape `livekit:7880/metrics`.
2. `docker compose --profile metrics up -d` поднимает :9090.
3. README описывает targets + Owner Inbox для SFU down.
