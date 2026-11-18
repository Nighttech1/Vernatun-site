# Architect-spec — W-42 / C-109–C-111

## Инварианты
- Multi-party; mute-by-default; API `/api/lounge/*` без смены контракта.
- `/campus` URL; static HTML не удалять; VPS нет.
- Mock ахперики — только UI, не publish в LiveKit.

## C-109 Lobby
1. H1: только «Голосовые комнаты»; удалить span `campus-hero-accent` и underline CSS usage.
2. Featured: CSS `.campus-featured-card` — color/white для title/meta/labels/badges; кнопка класс `.campus-btn-on-azure` → bg `#000` color `#fff` (не terracotta).
3. `Layout` NAV как сайт:
   - О нас → `/#club` (или `/`)
   - Расписание → `/schedule`
   - Учебные материалы → `/materials`
   - Статьи → `/articles`
   - Контакты → `/contacts`
   - Кампус → `/campus` active (+ optional LIVE dot)
4. Удалить `campus-filter-row` (liveOnly + view toggle); убрать state `liveOnly`.

## C-110 Instant join
`RoomPage`: при `roomId` и `!session` auto `join()` once (useEffect + ref guard).  
Убрать pre-join bar и `showJoinHint`.  
Пока `busy && !session` — room shell с статусом «Подключаемся…» (можно тот же topbar + BoardPanel без кнопки Войти).  
Ошибка — status + выход в лобби.

## C-111 Nick + mocks
1. `ParticipantList`: dblclick local row → input; `localParticipant.setName(trimmed)`; поднять `onDisplayNameChange` в RoomConnected.
2. `boardDemo.ts` → `getBoardDemo(roomId)` с 4–5 вариантами.
3. `BoardPanel` принимает `roomId`, берёт demo по id.
4. Mock peers: константа 4 имён «ахперик N»; рендер после реальных; class `participant-item--mock`; без dblclick rename.

## Chain
Frontend → Tester → Fixer → Deployer localhost → Client
