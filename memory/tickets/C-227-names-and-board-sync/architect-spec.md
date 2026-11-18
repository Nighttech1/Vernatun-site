# Architect-spec — W-67 / C-224…C-231 (Lounge room QA)

## Контекст
Кампус / LiveKit room: LegalGate, layout, tldraw board, session timer, owner admin.

## Решения по тикетам

### C-224 LegalGate white text (FE)
`.legal-gate-disclaimer` и `p` внутри — `color: #ffffff !important` (перебить наследование azure из shell).

### C-225 Side resize (FE)
Desktop: CSS var `--room-side-width` (default 360, min 280, max 560). Drag handle `.room-resize-handle` между `.room-col--center` и `.room-col--chat`. Persist `localStorage vernatun-room-side-w`.

### C-226 Toolbar drag (FE)
В `CustomToolbar.onDragStart`: не return на grip-кнопке (`.wb-toolbar-grip` или `data-drag-handle`). Pointer events на grip включают drag.

### C-227 Names + board sync (FE, P0)
**Names:** после `setName` также `publishData` `{type:'peer.rename', name}` и локальный map `identity→name` для remote (fallback если LiveKit name event запаздывает). UI: `nameById[p.identity] || p.name || identity`.

**Board:** убрать опору только на per-browser IndexedDB как источник правды для сессии. Хук `useLivekitTldrawSync`:
- `store.listen` → debounce publish `board.diff` / periodic `board.snapshot` (chunked ≤12KB)
- join → `board.sync.request`; peer с редактором отвечает snapshot
- `board.clear` / session end → `editor.store.clear()` + delete persistenceKey
- Не ставить отдельный tldraw sync server в этой волне (LiveKit DC достаточно для V1).

### C-228 Remove Fair Meter (FE)
Удалить `useFairSpeakingMeter.ts`, импорты, props fair*, speakerHints/constructionHints UI, CSS `.fair-meter*` / `.participant-fair*`. Subtitle участника без фраз-подсказок.

### C-229 Admin sentinel settings (BE + admin FE)
- Пароль localhost: `LOUNGE_OWNER_PASSWORD` из `liverooms/infra/.env` → сообщить Клиенту в отчёте (не в бандл).
- Файл `campus-data/sentinel-patterns.json` (keywords[] + patterns[] per sentinel id).
- `GET/PUT /api/lounge/admin/sentinel-patterns` с `X-Owner-Password`.
- Admin UI: вкладка «Настройки» — textarea на sentinel; Save.
- Web: `GET /api/lounge/sentinel-patterns` (public read) → engine merges over defaults.

### C-230 Empty room timer reset (BE, P0)
- Уже есть `maybe_clear_chat` → `end_room_session`. Усилить:
  1. LiveKit webhook `participant_left` / `room_finished` → `maybe_clear_chat`
  2. Daemon every 20s: для каждой `session.json` если `livekit_online==0` → end
- Не wipe при `online is None` (API down).

### C-231 10-min banner + end wipe (FE+BE, P0)
- FE: banner fixed top when `leftSec <= 600 && leftSec > 0`, orange bg, white text `Сеанс закончится через MM:SS`.
- FE: `leftSec === 0` → navigate lobby + clear local board persistence + leave LiveKit.
- BE: on timeout `end_room_session` + LiveKit `RoomService.DeleteRoom` / remove all participants; ensure chat wipe.

## Границы
- VPS deploy — нет (только localhost).
- Не трогать sputnik_data / memory_storage.
- Spacedeck purge оставить no-op safe; primary board = tldraw.

## Acceptance (язык Клиента)
1. LegalGate: текст в чёрном блоке белый.
2. Desktop: тяну границу — чат уже/шире, доска растёт.
3. Панель кнопок доски ездит за grip.
4. Два браузера: вижу чужой ник после смены; рисую — видят оба.
5. Нет % эфира и фраз под ником.
6. Админ: пароль известен; вкладка Настройки сохраняет образцы.
7. Ушли оба — таймер в лобби сброшен.
8. За 10 мин — оранжевая плашка; по 0 — в лобби, чат/доска пустые.
