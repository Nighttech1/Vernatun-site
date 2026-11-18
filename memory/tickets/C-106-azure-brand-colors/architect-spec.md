# Architect-spec — W-41 / C-106 + C-107

## Профиль
Vernatun Lounge (Кампус) · React SPA `liverooms/web/` · Frontend A (luxury web tokens)

## Инварианты
- Multi-party LiveKit без Stage/raise-hand — не трогать.
- API `/api/lounge/*` без изменений.
- Static `lounge.html` / `room.html` не удалять.
- Data-safety: не wipe chat/DB/volumes.
- Prod/VPS — запрещён в этой волне (C-108 backlog).

---

## C-106 — Палитра azure

### Канон с сайта (`js/tailwind-config.js` / `css/site.css`)
| Токен | Hex | Роль |
|-------|-----|------|
| azure | `#2A5A84` | главный синий: инк, заголовки, secondary buttons, featured dark wash, filter active |
| terracotta | `#C95B36` (допустимо `#C25E28`) | primary CTA |
| parchment | `#F9F6F0` | page surface / cream base |
| mist | `#E8E2D8` или близкий border | hairlines |

### Изменения `tokens.css`
1. Добавить `--brand-azure: #2a5a84`.
2. `--brand-navy` → либо deprecate alias на azure, либо удалить из «главных»; **не** оставлять `#1e293b` как primary brand.
3. `--brand-slate` / ink для body: использовать azure (или слегка темнее azure, но **не** slate `#0F172A` как основной текст) — канон сайта: текст `#2A5A84`.
4. `--brand-surface` / cream → parchment `#F9F6F0`.
5. `--color-azure: var(--brand-azure)` (сейчас ошибочно = navy).
6. `--color-ink: var(--brand-azure)`.
7. Terracotta: выровнять primary на `#C95B36` (hover можно `#A34B1C` / darken).
8. Shadows: смягчить rgba от azure, не от `#0f172a`.

### CSS consumers
- `campus.css` / `room.css`: все `var(--brand-navy)` для bg/кнопок → `var(--brand-azure)`; text slate → azure ink.
- Featured card dark panel: azure (можно чуть darker via `color-mix` от azure), не charcoal navy.
- `ParticipantList.tsx` hardcoded `#1e293b` → `#2A5A84`.

### DESIGN.md
Обновить colors: убрать navy как brand primary; azure + parchment + terracotta. Overview text без «navy/slate ink».

### Acceptance
After-скрины desktop 1440 + iPhone + Android: нет доминирующего `#1E293B`; кнопки карточек и featured — azure; CTA terracotta; фон parchment. Визуально родственен vernatunspeakclub.com.

---

## C-107 — URL `/campus`

### Routes (`App.tsx`)
- `/` → Navigate `/campus`
- `/campus` → LobbyPage
- `/lounge` и `/lounge/` → Navigate `/campus` replace (legacy)
- `*` → Navigate `/campus`
- `/room` без изменений

### Links
- `Layout.tsx`: brand + nav «Голосовые комнаты» → `/campus`
- `RoomPage.tsx`: exit navigate → `/campus`

### Docs (лёгкие)
- `liverooms/web/DESIGN.md`: упомянуть path `/campus`
- `DEVELOPMENT_PLAN.md`: отметить целевой URL `/campus` (одна строка; не переписывать фазы)

### Не в scope
nginx prod, static HTML redirects на VPS.

### Acceptance
Адресная строка лобби: `…/campus`. Старый `/lounge` редиректит на `/campus`. Room exit ведёт на `/campus`.

---

## Chain
См. `chain.md` рядом.
