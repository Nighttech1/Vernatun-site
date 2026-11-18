# Guards — C-187 / C-188 / C-189 (W-61 ban A)

## Regression

1. `POST /api/lounge/admin/bans` with owner password + client_id → 200, ban in GET list.
2. `GET /api/lounge/token?room=…&client_id=<banned>` → 403 `error=banned` (even with legal consent).
3. `POST /api/lounge/admin/bans/lift` → token again succeeds (or fails only on legal/password, not banned).
4. Footer: «Политика конфиденциальности» opens privacy modal (`?privacy=1` or click).
5. Admin inbox report with target_client_id shows «Заблокировать»; tab «Баны» lists active bans.

## Data-safety

- Only append to `bans.jsonl` / `client_seen.jsonl` under campus-data.
- Never wipe sputnik_data.db / memory_storage.
