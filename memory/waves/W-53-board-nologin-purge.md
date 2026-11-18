# W-53 — Board no-login + purge on room empty

**Статус:** deployed localhost · awaiting Client · 2026-09-25  

## Итог
- C-149: Instant Edit `?spaceAuth=` + `nickname=` — **без аккаунта Spacedeck** (гость только ник из комнаты)
- C-148: `purge_board` при 0 участников — DELETE Space + wipe storage
- Патч guest skip в `spacedeck_spaces.js` (в контейнере)

