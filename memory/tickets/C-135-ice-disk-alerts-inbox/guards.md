# Guards — C-135 ICE / disk alerts

1. webhook body с `ice_failed` → inbox kind=alert title=ice_errors (cooldown).
2. webhooks.log > порога → webhook_log_large (cooldown).
3. Без wipe логов.
