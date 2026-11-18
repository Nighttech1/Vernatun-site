# Guards — C-117 host mute/kick

1. `lounge_api.py`: token `is_host` when room empty; `room_admin` + metadata role=host.
2. `POST /api/lounge/moderation` exists; audit → `moderation.log` append-only.
3. FE: при `isHost`/metadata host — кнопки Mute/Kick на remote (не mock).
4. Live mute/kick на vernatunspeakclub.com — после выкладки обновлённого `lounge_api.py` (не C-108 SPA cutover). До выкладки UI/код готовы; API prod может отвечать 404 на `/moderation`.
