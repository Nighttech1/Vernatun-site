# Guards — C-96 React room shell

## Checks (2026-09-20)
1. Deep-link `http://127.0.0.1:5173/room?room=open` shows title + «Войти в комнату»
2. After Join: display name `ахперик N`, buttons Mic / Leave / Share, participant list, chat panel
3. LiveKit: status «Вы в комнате…»; mic remains off until gesture (`audio={false}` at connect)
4. Share URL contains `/room?room=`
5. Screenshot after join: `memory/waves/W-37-after-room-joined.png`

## Manual dual-peer (Client)
Playwright ≠ audio e2e. Client: two browsers unmute → hear each other.

## Regression class
Cannot join / no RoomAudioRenderer path / Stage-only queue / missing share-chat parity → reopen C-96.
