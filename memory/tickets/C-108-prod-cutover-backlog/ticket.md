# C-108 — Backlog: cutover React Кампуса на prod (не исполнять без «да»)

**P2** · backlog · open (не в W-41 исполнении)

## Зона / Экран
vernatunspeakclub.com `/campus` + `/room` · nginx · static fallback

## Факт
Prod всё ещё static `lounge.html` / `room.html`. React SPA только на localhost. Пользователь запретил VPS до вердикта Клиента без P0/P1 и явного согласия.

## Ожидание (когда разрешат)
- Подготовка cutover: build SPA, nginx location `/campus` + `/room`, redirect `/lounge`→`/campus`.
- Static fallback не ломать до успешного cutover.
- LiveKit/API тома/данные не wipe (`memory_storage`, `sputnik_data.db` не трогать).
- Только после Клиента «согласовано» по цвету/URL **и** явного «да» пользователя на VPS.

## Приоритет
P2 (очередь после W-41)

## Зона
Deployer (+ Backend nginx при chain)
