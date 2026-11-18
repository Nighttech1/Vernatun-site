# W-49 — P2 UI/ops (без фазы 6 AI)

**Статус:** согласовано Клиентом · 2026-09-23  
**before_sha:** no-git

## Тикеты
| ID | Суть | P | Guard |
|----|------|---|-------|
| C-136 | Fair Meter / lexicon light motion | P2 | yes · after room visual 2026-09-23 |
| C-137 | Grafana rooms monitor (localhost) | P2 | yes · dashboard Vernatun LiveKit rooms |
| C-138 | Mute/kick audit в Owner Inbox | P2 | yes · вкладка Модерация |
| C-139 | Load capacity N×M doc + методика | P2 | yes · LOAD_CAPACITY.md |

## Client re-check (замечание «внутри комнаты»)
- Комната `open` live: статус «В ЭФИРЕ», mute-by-default, доска лексики + клик → «Словарь (1)»
- CSS в живой комнате: `scaleX(--fair-pct)`, `lexicon-enter`, `prefers-reduced-motion`
- Owner Inbox → Модерация: MUTE/KICK из moderation.log
- Grafana :3000 → Vernatun LiveKit rooms (admin/admin, Skip)

## Localhost URLs
- Campus: http://127.0.0.1:5173/campus
- Owner Inbox: http://127.0.0.1:5174/ (dev: `test-owner-local`)
- API: http://127.0.0.1:8765/
- Prometheus: http://127.0.0.1:9090/
- Grafana: http://127.0.0.1:3000/ (admin/admin)

## Deployer notes (эта сессия)
- Нужен `VITE_API_PROXY_TARGET=http://127.0.0.1:8765` (файл `liverooms/web/.env.local`)
- API: `LIVEKIT_PUBLIC_URL` ← из `LIVEKIT_URL` (`ws://127.0.0.1:7880`), иначе токен указывает на prod wss

## Вне волны
STT / private coach / filler / toxicity / AI consent → **W-50 фаза 6**.  
VPS/prod — только после явного «да».
