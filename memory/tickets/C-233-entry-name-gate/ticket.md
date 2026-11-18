### [C-233] Обязательный ник при входе; без смены в сессии; late-joiner видит ник
- **Зона:** RoomPage / LiveKit token / ParticipantList
- **Факт:** Второй вошедший не видит обновлённый ник первого; rename mid-session асимметричен
- **Ожидание:**
  1. После LegalGate — модалка «Ваше имя» (обязательно, нельзя войти пустым)
  2. Имя уходит в `/token` (`display_name`) и в LiveKit AccessToken.with_name
  3. Убрать dblclick/rename в сессии
  4. На connect: announce `peer.hello` с именем; late joiner запрашивает roster
- **Приоритет:** P0
- **Зона:** Backend + Frontend
