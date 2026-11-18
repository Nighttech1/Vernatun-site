# Guards — C-110 instant room join

1. `/room?room=a1` — нет кнопки «Войти в комнату» при успешном connect
2. После load: `.room-live-label` = «В ЭФИРЕ:» (или краткий «ПОДКЛЮЧЕНИЕ» → эфир)
3. Ошибка token — «Повторить вход», не обязательный pre-join happy-path
4. Mute-by-default сохранён (audio={false} на LiveKitRoom)
