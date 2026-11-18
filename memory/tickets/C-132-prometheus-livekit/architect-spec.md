# Architect-spec — W-48 P1 ops close

## Цель
Закрыть оставшиеся P1 плана: Prometheus, webhook URL, Lighthouse, ICE/disk → Owner Inbox.

## Chain
```
Архитектор → Backend (C-135) → Infra (C-132, C-133) → Тестировщик (C-134) → Docs/план → Клиент
```

## Инварианты
- Data-safety append-only; VPS нет; Owner Inbox канон алертов.
- Prometheus optional в compose profile `metrics` чтобы не ломать лёгкий dev без образа.

## Prometheus
```yaml
scrape_configs:
  - job_name: livekit
    static_configs:
      - targets: ['livekit:7880']
    metrics_path: /metrics
```
Compose: `prometheus` depends_on livekit, port 9090:9090, profile `metrics`.

## Webhook livekit.yaml
```yaml
webhook:
  api_key: devkey
  urls:
    - http://host.docker.internal:8765/api/lounge/webhooks/livekit
```

## C-135
Extend sfu_watch_loop or separate: disk size check; on webhook POST scan body for ice/connection_failed strings.
