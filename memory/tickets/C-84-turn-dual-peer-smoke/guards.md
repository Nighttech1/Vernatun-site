# Guards — C-84

См. общий файл: `../C-82-lounge-multispeak-phase0/guards.md`.

Dual-peer:
1. LiveKit+coturn up
2. `python liverooms/meet/token_server.py`
3. Browser A: http://127.0.0.1:8765/?as=a
4. Browser B: http://127.0.0.1:8765/?as=b
5. Both Join → Unmute → speak **at the same time**
