# Architect-spec — W-49 P2 UI/ops (без фазы 6 AI)

## Цель
Закрыть четыре P2 плана Lounge: лёгкий motion meter/лексики, Grafana дашборд комнат на localhost, чтение mute/kick audit в Owner Inbox, дока нагрузочного ориентира N×M.

## Вне scope (отложено)
STT, private coach, filler words, toxicity classifier, AI consent, Telegram HITL, VPS/prod.

## Инварианты
- Multi-party одновременная речь; mute-by-default.
- Data-safety: append/read only для `moderation.log` / inbox; не wipe `sputnik_data.db`, `memory_storage`, inbox.
- VPS только после явного «да».

---

## C-136 — Fair Meter / Lexicon motion
- Paths: `liverooms/web/src/styles/room.css`, при необходимости `ParticipantList.tsx` / `RoomSidePanel.tsx` (классы enter).
- Meter fill: анимировать через `transform: scaleX` от `transform-origin: left` (не `width` layout), opacity микро.
- Lexicon: `@keyframes` / WAAPI enter на `.lexicon-focus` и новый list item; duration 150–220ms; ease-out.
- `@media (prefers-reduced-motion: reduce)` — transition/animation none.
- Без GSAP/Lenis/Framer на room shell.

## C-137 — Grafana monitor
- Compose profile `metrics`: сервис `grafana` (порт 3000), datasource Prometheus, provisioned dashboard JSON.
- Метрики LiveKit (типичные): `livekit_room_*`, `livekit_node_*`, participant/packet counters — что реально отдаёт `/metrics` после scrape.
- Auth Grafana: admin/admin только localhost (документировать смену).
- README infra: URL + `docker compose --profile metrics up -d`.

## C-138 — Moderation audit API + UI
- Backend: `GET /api/lounge/admin/moderation?limit=` + `X-Owner-Password`; `read_mod_log(limit)` tail JSONL; 401 без пароля.
- Frontend admin: вкладки «Входящие» | «Модерация»; список action/room/target/requester/ts/ok.
- Не копировать log в inbox (отдельный endpoint); не truncate файла.

## C-139 — LOAD_CAPACITY.md
- Ориентир пилота localhost: консервативные N×M (напр. 3–5 комнат × 8–12 слушателей) + методика через Prometheus/ручной dual-peer.
- VPS ориентир — черновик с пометкой «не деплой без да».
- Ссылка из `RUNBOOK.md` и чекбокс в `DEVELOPMENT_PLAN.md` после закрытия.

## Acceptance (язык Клиента)
1. В комнате на телефоне полоски meter и карточка лексики мягко появляются, скролл не дёргается; с reduced-motion — без анимации.
2. `compose --profile metrics` → Grafana на :3000 показывает LiveKit/комнаты.
3. В кабинете после пароля вкладка «Модерация» показывает mute/kick из log.
4. В репо есть `LOAD_CAPACITY.md` с цифрами и методикой.
