# Guards — C-133 Webhook URL

1. `liverooms/infra/livekit.yaml` содержит webhook → host.docker.internal:8765/api/lounge/webhooks/livekit.
2. POST webhook → 200 + строка в webhooks.log (append).
3. VPS template имеет WEBHOOK_URL_PLACEHOLDER.
