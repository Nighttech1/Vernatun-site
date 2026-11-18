# Chain — W-50 Phase 6 AI

1. **Архитектор** — spec (done): `architect-spec.md`
2. **AI Bridge** — промпты coach/filler/toxicity; контракт degraded; stubs без ключей
3. **Backend** — endpoints consent/stt/coach + append logs; не ломать token/rooms
4. **Frontend** — consent UI, private coach panel, wire DataChannel/API; mute-by-default intact
5. **Тестировщик** — unit/API + guards (degrade, privacy, consent)
6. **Фиксер** — до зелёного
7. **Деплоер** — localhost only (API + Vite); **не** VPS
8. **Клиент** — приёмка desktop 1440 + mobile; слово «согласовано»

Overlapping paths: `lounge_api.py`, room React shell, admin inbox — **не** параллелить Backend и Frontend на одних файлах без очереди.

Skills: `ai-bridge` → `backend` → Frontend (`livekit-voice-rooms` + `voice-room-didactics`) → `tester` → `fixer` → `deployer`.
