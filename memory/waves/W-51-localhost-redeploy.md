# W-51 — Redeploy localhost (приёмка W-50)

**Статус:** deployed · awaiting Client · 2026-09-25  
**Цель:** поднять стек Кампуса на localhost для Клиента (без VPS).  
**Тикеты:** C-140…C-144 (уже implemented + guards; нужна живая среда).

## Chain (deploy-only)

1. Архитектор — этот файл + границы  
2. Деплоер — Docker LiveKit → Lounge API → Vite Campus (± admin)  
3. Тестировщик — health 7880 / 8765 / 5173  
4. Клиент — приёмка  

**Не в scope:** код фич, VPS, wipe данных.

## URLs

| Сервис | URL |
|--------|-----|
| Campus | http://127.0.0.1:5173/campus |
| Lounge API | http://127.0.0.1:8765/ |
| LiveKit | http://127.0.0.1:7880 / ws://127.0.0.1:7880 |
| Owner admin (опц.) | http://127.0.0.1:5174/ |

## Gate

VPS запрещён. Data-safety: не трогать `sputnik_data.db` / `memory_storage`.

## Deploy result (2026-09-25)

| Компонент | Статус |
|-----------|--------|
| Docker LiveKit + coturn (+ metrics) | up |
| Lounge API :8765 | `{"ok":true}` |
| Vite Campus :5173 | HTTP 200 |
| Vite→API proxy `/api/lounge/rooms` | 200 |
| AI consent/coach | degraded OK (без ключа) |
| Скрины Клиента | `client-campus-1440.png`, `client-campus-390.png` |
