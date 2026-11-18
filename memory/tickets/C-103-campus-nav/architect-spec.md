# Architect-spec — W-40 / C-103–C-105

## Цель
Закрыть главные визуальные дыры vs campus/room refs при Century Gothic + multi-party.

## C-103 Nav
`Layout.tsx` + campus.css. Links:
- Программа → `/` (or about)
- Расписание → `/schedule` (check site paths)
- Материалы → `/formats` or materials page if exists
- Голосовые → `/lounge` active
- Словарь → `#campus-rules` temporary stub

Mobile: `.campus-nav` horizontal scroll inside header OR collapse under details — no body overflow.

## C-104 Filters
State: `liveOnly` boolean; timeline toggle disabled with title «скоро».  
Popular: room with max online among filtered, or featured open; class `campus-card--popular`.

## C-105 Board + tabs
Static didactic content in `src/content/boardDemo.ts` (Armenian phrases Yerevan/Gyumri style from ref — short).  
`ChatPanel` wrap with tabs. Session timer in `RoomConnected` from connect time.  
No raise-hand. No real PDF.

## Chain
Frontend → Tester → Fixer → Deployer localhost → Client
