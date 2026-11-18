# Architect-spec — W-37 / C-94–C-96

## Цель волны
Поднять **React SPA Lounge** (Фаза 3 плана) рядом со static MVP.  
API не меняем (rooms / token / chat уже на VPS). Static `lounge.html` / `room.html` остаются fallback до cutover Клиента.

## Стек
| Слой | Выбор |
|------|--------|
| App | Vite 5 + React 18 + TypeScript |
| Корневая папка | `liverooms/web/` |
| LiveKit | `livekit-client` + `@livekit/components-react` (+ styles CSS пакета) |
| Router | `react-router-dom` |
| Стили | CSS variables + минимальный CSS (токены сайта); Tailwind optional если быстро — иначе plain CSS с теми же hex |
| Шрифт | Century Gothic из `/fonts/` (в dev — proxy / public copy) |

### Токены бренда (канон site)
- parchment `#F9F6F0`, azure `#2A5A84`, terracotta `#C95B36`, mist borders как на сайте
- Запрет: purple SaaS, Inter/Roboto default stack

## Маршруты SPA
| Path | Экран | Тикет |
|------|--------|-------|
| `/lounge` | LobbyPage — список + фильтр CEFR | C-95 |
| `/room` | RoomPage — query `?room=<id>` (deep-link parity) | C-96 |

`base: '/'` в Vite; `build.outDir` → `liverooms/web/dist`.

## Dev localhost
1. LiveKit + lounge API уже могут быть на VPS; для local:
   - Vite `:5173`
   - proxy `/api` → `https://vernatunspeakclub.com` **или** `http://127.0.0.1:8765` если local token_server/lounge_api up
2. Prefer proxy to **local** `liverooms/meet/token_server.py` / lounge_api if running; else prod API (read-only ok for rooms/token).
3. Static site chrome optional: SPA pages самодостаточны (свой header «← Вернатун» + «Голосовые комнаты»), без обязательного Alpine chrome в этой волне.

## C-94 — Scaffold
- `package.json`, Vite config, `index.html`, `src/main.tsx`, `src/App.tsx`
- `src/styles/tokens.css`
- README: `npm install` / `npm run dev` / `npm run build`
- Не трогать корень сайта `package.json` (playwright) — отдельный package в `liverooms/web`

## C-95 — Lobby
- `GET /api/lounge/rooms` → cards/rows
- Filter: `all` | `any`(open) | `A1` | `B1` | … по уникальным `cefr` из ответа
- CTA → `/room?room=<id>`
- States: loading / error / empty
- Mobile: одна колонка, no horizontal scroll

## C-96 — Room shell
- Read `room` from `URLSearchParams`
- Join: `GET /api/lounge/token?room=` → `{ token, url, identity/display_name }` (как static)
- `<LiveKitRoom token url connect audio={false} video={false}>` — mic off until gesture
- Inside: `<RoomAudioRenderer />`, participant list (`useParticipants` / `useTracks` / speaking via `useIsSpeaking`)
- Buttons: Войти / Включить микрофон (`useLocalParticipant` setMicrophoneEnabled) / Выйти
- Share: copy `origin + /room?room=`
- Chat: poll/GET + POST existing `/api/lounge/chat` (parity C-93) — не LiveKit text stream в этой волне
- Status: connecting / connected / reconnecting / error (useConnectionState)
- No dating UI

## Backend (минимально)
Только если Vite не может проксировать: CORS на lounge_api для `http://127.0.0.1:5173`.  
Предпочтение: **vite proxy**, без изменения prod API. Backend в chain — optional gate.

## Deployer
- Localhost: `npm run build` + `npm run preview` **или** `vite` + document URL для Клиента
- Не деплоить SPA на VPS в этой волне (gate Клиента)
- Static fallback на prod не трогаем

## Acceptance (языком Клиента)
1. На localhost открывается React-лобби со списком комнат.
2. Вход в комнату → unmute по кнопке → слышен remote (dual-peer manual guard).
3. Share-ссылка и чат работают как на static.
4. Desktop 1440 + iPhone/Android: без горизонтального скролла, CTA пальцем.
5. Нет Discord / purple SaaS.

## Не в волне
Фаза 4 дидактика, Trust Score, AI, Prometheus, замена prod static.
