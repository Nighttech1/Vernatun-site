# Guards — C-83

См. общий файл: `../C-82-lounge-multispeak-phase0/guards.md` (волна W-32).

Verify:
```
cd liverooms/infra
docker compose ps
python ../../plugins/realtime/livekit_health_check.py --url http://127.0.0.1:7880
```
