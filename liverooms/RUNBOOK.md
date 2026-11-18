# Runbook — LiveKit и Lounge API (Вернатун Кампус)

Простыми словами: если **комнаты молчат** или сайт не пускает в Кампус — сначала смотрите этот файл.  
Ничего из данных пользователей (`sputnik_data.db`, `memory_storage`, чаты, trust) **не удаляем** без явной просьбы владельца.

---

## Быстрая диагностика («комнаты молчат»)

1. Открыть health LiveKit (локально обычно `http://127.0.0.1:7880` — ответ без ошибки).
2. Открыть Lounge API: `http://127.0.0.1:8765/` → `{"ok": true, "service": "vernatun-lounge"}`.
3. В браузере: `http://127.0.0.1:5173/campus` (Vite) — лобби показывает список комнат.
4. Два браузера → одна комната → включить микрофон **по жесту** на каждом.

Если шаг 1 красный — чините SFU (ниже). Если 1 зелёный, а 2 красный — чините API. Если 1–2 зелёные, а звука нет — микрофон/права браузера или TURN (см. REGRESSION.md).

---

## Рестарт LiveKit (localhost Docker)

```bash
cd liverooms/infra
docker compose ps
docker compose restart
# или полный подъём:
docker compose up -d
```

После рестарта снова проверьте health и тестовую комнату.  
**Не** удаляйте тома с данными приложения Sputnik при работе с LiveKit.

---

## Lounge API

- Скрипт: `liverooms/infra/vps/lounge_api.py`
- Порт: `MEET_PORT` (по умолчанию `8765`)
- Секреты только в `.env` / окружении: `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` — **не коммитить**.
- Логи модерации: `moderation.log`, жалобы: `reports.log`, escalate: `escalation.log`, trust: `trust.json` (update scores, не wipe).
- Чтение журнала mute/kick владельцем: кабинет `liverooms/admin/` → вкладка **Модерация** (`GET /api/lounge/admin/moderation`).
- Нагрузка пилота: [`LOAD_CAPACITY.md`](./LOAD_CAPACITY.md) (N×M ориентир + методика).
- Мониторинг: `docker compose --profile metrics up -d` → Prometheus :9090, Grafana :3000.

Перезапуск API: остановить процесс Python и запустить снова с теми же env и томами путей к `rooms.json` / trust.

---

## Ротация ключей LiveKit

1. Сгенерировать новую пару key/secret в конфиге LiveKit.
2. Обновить `.env` API **и** сервер LiveKit **одновременно**.
3. Перезапустить LiveKit, затем API.
4. Старые JWT перестанут работать — пользователи просто перезайдут в комнату.
5. Старый `.env` не публиковать; бэкап секретов — вне git.

---

## Кабинет владельца (жалобы + SFU)

Не Telegram. Жалобы из комнат и алерт «SFU down» пишутся в `owner_inbox.jsonl`.

- UI: `liverooms/admin/` → http://127.0.0.1:5174/
- Пароль: `LOUNGE_OWNER_PASSWORD` (только в env)
- API: `GET /api/lounge/admin/inbox` + заголовок `X-Owner-Password`

Домен для кабинета — когда скажет владелец.

---

## Backup конфигов (без wipe данных)

Сохранить копии:

- `docker-compose.yml` / конфиг LiveKit
- `.env` (в сейф, не в репозиторий)
- `rooms.json`
- При необходимости: `trust.json`, `chat/*.json` (append-only предпочтительнее)

Перед любой заменой файла данных на сервере: `cp file file.bak.YYYYMMDD`.

---

## Prod VPS

Только после вердикта Клиента **без открытых P0/P1** и явного «да» на выкладку.  
При пересоздании контейнеров Sputnik — оба тома (`memory_storage` и `sputnik_data.db`), см. data-safety rules.

---

## Связанное

- `liverooms/REGRESSION.md` — чеклист token/kick/TURN
- `liverooms/ARCHITECTURE.md` — как устроена система
- `liverooms/DEVELOPMENT_PLAN.md` — что ещё в работе
