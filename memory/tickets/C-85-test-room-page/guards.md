# Guards — W-33 C-85/C-86/C-87

## Public

- [x] https://vernatunspeakclub.com/test-room → 200, содержит `testRoom()`
- [x] https://vernatunspeakclub.com/api/lounge/token?identity=… → JSON с `token` и `url: wss://vernatunspeakclub.com`
- [x] Nav: пункт «Тест комната» в `js/site.js`
- [x] LiveKit + coturn docker Up на VPS
- [x] Token systemd `vernatun-livekit-token` active (wrapper `/home/infinity/run-vernatun-token.sh`)
- [x] nginx `/rtc`, `/twirp`, `/api/lounge/token` в sites-available/vernatunspeakclub.com

## Manual (Клиент)

- [ ] Два устройства: открыть /test-room → Войти → Включить микрофон → говорить одновременно

## Notes

Полный `deploy_vernatun_to_vps.ps1` оборвался на images SCP — критичные файлы залиты точечно. При следующем полном деплое повторить images при необходимости.
