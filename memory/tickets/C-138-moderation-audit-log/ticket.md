# C-138 — Админ-API: mute/kick audit log в Owner Inbox

**P2** · W-49 · open

## Зона / Экран
Owner Inbox `liverooms/admin/` + API `lounge_api.py`

## Факт
Mute/kick уже пишутся в `moderation.log` (append-only), но кабинет владельца показывает только inbox (жалобы/алерты). Нет чтения audit log.

## Ожидание
- `GET /api/lounge/admin/moderation` (пароль `X-Owner-Password`) → последние N записей из `moderation.log` (read-only, без wipe).
- Вкладка / секция в кабинете: «Модерация» — mute / kick / escalate, комната, кто, на кого, время, ok/error.
- Data-safety: только чтение/append; не трогать `sputnik_data.db` / `memory_storage` / inbox wipe.

## Приоритет
P2

## Зона
Backend + Frontend (admin)

## Скрин-улика
visual/after.png вкладки модерации после логина
