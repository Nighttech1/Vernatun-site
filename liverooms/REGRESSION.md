# Регресс голосовых комнат (Vernatun Lounge)

Ручной чеклист **P0** поверх dual-peer (см. `memory/tickets/C-120-dual-peer-checklist-a11y/guards.md`).  
Не заменяет живую проверку «двое слышат друг друга».

## 1. Токен (expired / отказ)

| Шаг | Ожидание |
|-----|----------|
| Открыть `/room?room=несуществует` | Сообщение об ошибке / room_not_found, не «вечный connecting» |
| Trust &lt; 40 + комната B1+/B2/C1 (`slang` или `b2`) | Вход закрыт: текст про Academic Trust Score |
| Нормальный вход в `open` | Token + LiveKit connect, mute-by-default |

*Истёкший JWT:* воспроизводится редко на localhost (короткий TTL в API). Если connection отвалится с auth error — UI показывает статус ошибки / leave, без белого экрана.

## 2. Kick

| Шаг | Ожидание |
|-----|----------|
| Host нажимает Kick у remote | Цель видит экран «Вас исключили» (`LeaveReason=kicked`) |
| Host остаётся в комнате | Host продолжает слышать остальных |

## 3. Host disconnect

| Шаг | Ожидание |
|-----|----------|
| Host выходит кнопкой «Выйти» | Остальные **не** получают «комната завершена»; остаются connected |
| Новый вход в пустую комнату | Первый входящий снова `is_host` |

## 4. TURN-only (сеть без прямого UDP)

| Шаг | Ожидание |
|-----|----------|
| Localhost compose: coturn поднят (`liverooms/infra`) | Health LiveKit ok |
| Prod / LTE: клиент только через TURN | ICE connected; аудио есть (проверять на VPS после согласования) |

Заметка: полный TURN-only на домашнем Wi‑Fi часто не воспроизводится — отмечать в guards как «VPS/LTE».

## 5. Escalate (после C-122)

| Шаг | Ожидание |
|-----|----------|
| Host → Escalate | У цели снят publish; в `escalation.log` строка; Trust −25 если есть client_id |

## Связанные файлы

- API: `liverooms/infra/vps/lounge_api.py`
- UI leave: `RoomPage.tsx` / `RoomConnected.tsx`
- Runbook: `liverooms/RUNBOOK.md`
