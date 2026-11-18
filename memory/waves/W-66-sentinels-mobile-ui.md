# W-66 — Campus Sentinels ×5 + mobile room QA + board polish

**Дата:** 2026-09-27  
**Профиль:** Vernatun Lounge (Campus SPA + Admin + lounge_api)  
**Статус волны:** ПРИНЯТО Клиентом (localhost). VPS cutover — по явной команде «деплой».

## Цель

1. **P0** Evidence-First: пять сентинелов Кампуса (keyword/regex/heuristic; **без** live LLM; **без** авто-ban/mute/trust) — инцидент → удаление контента; баны только владелец.
2. **P1** Mobile room QA (iPhone + Android Playwright) + правка подписей авторов.
3. **P2** Косметика доски/гейта: баннер гостя, lock без confirm, только images, LegalGate spacing, color/size popover.

## Тикеты (P0 → P1 → P2)

| ID | P | Суть |
|----|---|------|
| [C-217](../tickets/C-217-campus-sentinels-x5/ticket.md) | P0 | 5 Sentinels Evidence-First + incidents API + Admin + help modal |
| [C-216](../tickets/C-216-mobile-room-qa/ticket.md) | P1 | Mobile room QA: layout, no H-scroll, CTAs |
| [C-219](../tickets/C-219-author-labels-local/ticket.md) | P1 | Author labels: flash on create; local-only on select |
| [C-218](../tickets/C-218-guest-banner-orange/ticket.md) | P2 | Guest canvas banner: no blue hatch; orange on white |
| [C-220](../tickets/C-220-board-lock-no-confirm/ticket.md) | P2 | Board lock: no confirm; blue outline when active |
| [C-221](../tickets/C-221-images-only-upload/ticket.md) | P2 | Remove PDF/Word upload; images only |
| [C-222](../tickets/C-222-legalgate-spacing/ticket.md) | P2 | LegalGate consent line-height/spacing |
| [C-223](../tickets/C-223-drawing-tools-hover/ticket.md) | P2 | Drawing tools hover: color/size popover |

**Открытый долг W-65 (не в scope W-66, но не забывать):** C-214 admin checkbox cascade.

## Chain (кратко)

```
Архитектор → Frontend → Backend → Тестировщик → Фиксер → Деплоер (localhost + VPS checklist) → Клиент
```

Спека: `memory/waves/W-66-sentinels-mobile-ui/architect-spec.md`  
Chain: `memory/waves/W-66-sentinels-mobile-ui/chain.md`

## Deploy gate

- Localhost после зелёных тестов — для приёмки Клиентом.
- **VPS/prod запрещён** до вердикта Клиента без P0/P1 и явного «деплой».
- Деплоер готовит **VPS readiness checklist** (тома, env, rollback) — без cutover.

## Инварианты

- Сентинелы: **SANCTIONS OFF** (не вызывают ban / mute / trust penalty).
- Удаление фигуры/чата после фиксации инцидента — да; пожизненный бан — только owner вручную.
- LLM-промпты только в `docs/` на потом; в этой волне **нет** live LLM calls.
- Data-safety: не wipe `campus-data`, moderation/inbox без явного запроса.

## VPS readiness

**Cutover status: READY, waiting for explicit «деплой».** Checklist green on localhost. Do not wipe campus-data on cutover. Gate: Client accepted W-66; start cutover only on user command.

### Docker LiveKit volumes

Local compose (`liverooms/infra/docker-compose.yml`) and VPS compose (`liverooms/infra/vps/docker-compose.yml`):

| Service | Mount | Notes |
|---------|--------|--------|
| livekit | `./livekit.yaml` → `/etc/livekit.yaml:ro` | Config only; no campus data inside LiveKit container |
| coturn | `./turnserver.conf` → `/etc/coturn/turnserver.conf:ro` | Config only |
| prometheus (profile metrics) | `./prometheus/prometheus.yml:ro` | Optional |
| grafana (profile metrics) | provisioning + dashboards `:ro` | Optional |

LiveKit/coturn do **not** hold `campus-data`. Never recreate those containers in a way that deletes host paths under campus / lounge API data.

### lounge_api env (must be set before any future cutover)

| Variable | Purpose | Localhost reference |
|----------|---------|---------------------|
| `LOUNGE_OWNER_PASSWORD` | Owner Admin (`X-Owner-Password`) | `liverooms/infra/.env` |
| `LOUNGE_INCIDENTS_LOG` | Append-only sentinel incidents JSONL | Default: `$LOUNGE_CAMPUS_DATA/incidents.jsonl` (local: `liverooms/campus-data/incidents.jsonl`) |
| `LOUNGE_CAMPUS_DATA` | Root for rooms chat/session, bans, evidence, incidents | Local: `liverooms/campus-data/`; VPS target (later): e.g. `/var/www/vernatun/campus` |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_*_URL` | Token + webhooks | From same `.env` / `lounge-owner.env` |
| `MEET_PORT` | API listen (8765) | `.env` |

Also keep existing owner paths from `install_lounge_api_systemd.sh` (inbox, trust, moderation, rooms.json) on the LiveKit deploy dir — do not wipe them when adding W-66 incidents.

### Both data mounts if lounge_api is containerized

If `lounge_api` ever runs in Docker (not only systemd), **always** mount both:

1. **Campus / lounge data** — host path → container `LOUNGE_CAMPUS_DATA` (rooms, `incidents.jsonl`, `bans.jsonl`, evidence, audit).
2. **API state beside campus** — rooms catalog / inbox / trust / moderation logs (today on VPS under `/home/infinity/Vernatun website/livekit/` via `lounge-owner.env`), **or** the Sputnik pair if that stack shares the host:
   - `-v /var/lib/sputnik/memory_storage:/app/memory_storage`
   - `-v /var/lib/sputnik/sputnik_data.db:<SPUTNIK_DB_PATH>`

Recreating a container **without** both mounts = data loss. Never `rm` / truncate `campus-data` or sputnik DB as part of deploy.

### Rollback note

1. Before cutover: copy current `lounge_api.py`, `rooms.json`, `lounge-owner.env`, and a snapshot of `LOUNGE_CAMPUS_DATA` (esp. `incidents.jsonl`, `bans.jsonl`, `rooms/`).
2. Rollback = restore previous `lounge_api.py` + env file + restart systemd/docker; **restore data dirs from snapshot only if the bad deploy wrote corrupt files** — do not replace a good live tree with an empty dump.
3. LiveKit/coturn rollback: revert `livekit.yaml` / compose image tag; config mounts are read-only — no campus wipe.
4. Incidents API is append-only; rollback of binary does not require deleting `incidents.jsonl`.

### Localhost smoke (2026-09-27 Deployer)

| URL | Status |
|-----|--------|
| `http://127.0.0.1:8765/api/lounge/rooms` | 200 |
| `http://127.0.0.1:5173/campus` | 200 |
| `http://127.0.0.1:5174/` | 200 |
| `POST /api/lounge/incidents` (`sentinel_id=tone`, `room=mansarda`) | `ok:true`, `action_taken=FLAGGED`, bans unchanged (0→0) |

**VPS ready:** no (checklist prepared; cutover blocked until Client).
