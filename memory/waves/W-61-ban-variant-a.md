# W-61 — Ban variant A — closed for Client review

**Статус:** localhost deployed · awaiting Client verdict  
**Тикеты:** C-187 done · C-188 done · C-189 done (privacy screenshot)

## URLs
- Кампус: http://127.0.0.1:5173/campus
- Политика: http://127.0.0.1:5173/campus?privacy=1
- Админ: http://127.0.0.1:5174/ (пароль из `liverooms/infra/.env` → `LOUNGE_OWNER_PASSWORD`)
- API: http://127.0.0.1:8765/

## Guards
ban → token 403 `banned` → lift → token 403 `legal_consent_required` (не banned).
