# LiveKit local infra — Vernatun Lounge phase 1

## Start

```powershell
cd e:\Applications\Vernatun\liverooms\infra
Copy-Item -Force .env.example .env
docker compose up -d
```

Dev keys (LiveKit `--dev`): **API key `devkey`**, **secret `secret`**.

## Health

```powershell
python e:\Applications\Vernatun\plugins\realtime\livekit_health_check.py --url http://127.0.0.1:7880
```

Ожидание: `"ok": true`.

## Prometheus (метрики LiveKit)

```powershell
docker compose --profile metrics up -d
```

Открыть http://127.0.0.1:9090 → Status → Targets → job `livekit` должен быть UP
(scrape `livekit:6789/metrics` — порт Prometheus в `livekit.yaml`).
Алерт «SFU down» для владельца — в Owner Inbox (`liverooms/admin/`), не в Telegram.

## Grafana (дашборд комнат, localhost)

После `docker compose --profile metrics up -d`:

- URL: http://127.0.0.1:3000  
- Логин по умолчанию: `admin` / `admin` (только localhost; смените пароль при первом входе).  
- Дашборд: **Vernatun LiveKit rooms** (папка Vernatun Lounge) — комнаты, участники, CPU ноды, scrape UP.

Prometheus datasource и dashboard подключаются автоматически из `liverooms/infra/grafana/`.

## Webhooks LiveKit → API

В `livekit.yaml` указан URL:

`http://host.docker.internal:8765/api/lounge/webhooks/livekit`

Lounge API должен быть запущен на хосте (:8765). События только **дописываются** в `webhooks.log` (без удаления).

## Dual-peer smoke (обязательно руками — несколько человек говорят сразу)

```powershell
python e:\Applications\Vernatun\liverooms\meet\token_server.py
```

1. Окно A: http://127.0.0.1:8765/?as=a  
2. Окно B: http://127.0.0.1:8765/?as=b  
3. Оба: **Join** → **Unmute**  
4. Говорите **одновременно** — должны слышать друг друга (модель TeamSpeak).

## Ports

| Port | Role |
|------|------|
| 7880 | LiveKit signaling / API |
| 6789 | LiveKit Prometheus `/metrics` |
| 7881 | WebRTC TCP |
| 7882/UDP | WebRTC UDP |
| 51000–51020/UDP | Media range |
| 3478 | coturn TURN |
| 8765 | meet smoke UI + tokens |
| 9090 | Prometheus (profile `metrics`) |
| 3000 | Grafana rooms dashboard (profile `metrics`) |

## Prod VPS

Только после вердикта Клиента и явного согласования. Не копировать dev secrets на прод.
