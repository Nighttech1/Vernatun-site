# W-62 — Admin UX + rooms speed + Noname + privacy human + 30MB

**Тикеты:** C-190…C-195  
**Chain:** Архитектор → Backend (rooms cache + Noname) → Admin UI → Frontend (privacy + board) → Тестер → Деплоер localhost → Клиент

## Admin tabs (canon)
1. **Жалобы** — только `kind=report` (+ IP/client в карточке)
2. **Модерация** — роботы/система: `toxicity_ai`, SFU `alert`, mute/kick из mod log; NSFW canvas audit если есть в API
3. **Баны** — активные баны + разбан

## Lists UX
Фикс. высота ~min(420px, 55vh), overflow-y scroll; поиск/фильтр/сорт: имя, дата, IP.

## Rooms speed
Кэш `livekit_online` TTL ~8s + один asyncio gather на каталог (не N×asyncio.run).

## Names
`Noname1`, `Noname2`… (identity `noname-…`).

## Board
Подпись кнопки + клиентский отказ > 30 МБ.
