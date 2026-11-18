# Guards — C-140 STT

- [x] POST `/api/lounge/ai/stt` без consent → ok:false consent_required (HTTP 200)
- [x] С consent + text → transcript passthrough, degraded без ключа
- [x] Пустой text → ok:false empty_text
- [x] SFU/token/rooms не зависят от STT
