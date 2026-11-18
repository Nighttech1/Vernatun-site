# Architect — W-53 board no-login + purge

## Ответ Клиенту (п.2)

**Можно без входа пользователя в Spacedeck** — через Instant Edit Link  
`/spaces/{id}?spaceAuth={edit_hash}` (анонимный editor).  
Создание Space делает **сервисный аккаунт** Lounge API один раз на комнату.  
Менять доску на другую **не нужно**, если provision сработает.

## C-149

1. Bootstrap user `campus-bot@…` (invite `vernatun-local`) + session token.  
2. `POST /api/spaces` → сохранить `space_id` + `edit_hash` в `board_spaces.json`.  
3. `GET /api/lounge/board` возвращает Instant Edit URL (не home).

## C-148

В `maybe_clear_chat` при `livekit_online == 0`:  
`purge_board(room)` → `DELETE /api/spaces/:id` + стереть файлы `storage/**/s{space_id}*` + убрать запись из map.

## Chain

Backend → Frontend (URL уже из API) → Tester → Deployer → Клиент
