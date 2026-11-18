# Vernatun Lounge — React SPA

Голосовые комнаты Вернатун (Фаза 3): React + LiveKit components.

## Требования

- Node.js 18+
- npm

## Установка

```bash
cd liverooms/web
npm install
```

## Разработка

```bash
npm run dev
```

Откройте [http://127.0.0.1:5173/campus](http://127.0.0.1:5173/campus).

Vite проксирует:

- `/api` → `https://vernatunspeakclub.com` (или переопределите через `.env`):

```env
VITE_API_PROXY_TARGET=http://127.0.0.1:8765
```

- `/fonts` → шрифты из корня репозитория (`/fonts/CenturyGothic.ttf`)

## Сборка

```bash
npm run build
```

Артефакты: `liverooms/web/dist/`.

Предпросмотр production-сборки:

```bash
npm run preview
```

## Маршруты

| Путь | Экран |
|------|--------|
| `/` | редирект на `/campus` |
| `/campus` | список комнат (лобби Кампуса) |
| `/lounge` | редирект на `/campus` (legacy) |
| `/room?room=<id>` | голосовая комната |

## API (без изменений на сервере)

- `GET /api/lounge/rooms` → `{ rooms: [{ id, title, description, cefr, online }] }`
- `GET /api/lounge/token?room=` → `{ token, url, display_name, identity, room_title, ... }`
- `GET /api/lounge/chat?room=` → `{ room, messages: [{ id, name, text, ts }] }`
- `POST /api/lounge/chat` → `{ ok, message }`
