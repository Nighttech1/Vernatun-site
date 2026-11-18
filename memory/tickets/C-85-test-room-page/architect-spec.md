# Architect-spec — W-33 / C-85–C-87

## Цель

Публичная тестовая голосовая комната на сайте Вернатун в фирменном стиле, чтобы проверить multi-speak с разных компьютеров/телефонов.

## Решения

| Что | Как |
|-----|-----|
| URL страницы | `/test-room` → `test-room.html` (clean URL как `/contacts`) |
| Нав | Пункт «Тест комната» в `js/site.js` (desktop + mobile) |
| UI | Static HTML + Alpine + LiveKit client CDN; стили как contacts |
| SFU | Docker LiveKit на том же VPS `155.212.187.181` |
| Сигналинг | `wss://vernatunspeakclub.com/livekit/` → nginx → `:7880` |
| Token | `https://vernatunspeakclub.com/api/lounge/token` → Python на `127.0.0.1:8765` |
| Ключи | `/home/infinity/Vernatun website/livekit/.env` на сервере, не в git |
| Модель | multi-party canPublish+canSubscribe (TeamSpeak) |
| Медиа порты | TCP 7881 + UDP 50000–50100 (+ TURN 3478) на firewall |

## Вне scope

Полный Lounge SPA, Trust Score, CEFR catalog, AI coach.

## Chain

1. Архитектор (этот spec)  
2. Frontend — page + nav  
3. Realtime + Deployer — VPS LiveKit, token, nginx, site deploy  
4. Tester — curl + guards  
5. Fixer → Client  
