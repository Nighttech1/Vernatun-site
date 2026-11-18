# chain.md — W-67

Порядок (не параллелить overlapping paths):

1. **Backend** — C-229 patterns API + file; C-230 empty sweeper/webhook; C-231 timeout kick/wipe
2. **Frontend (web)** — C-224, C-225, C-226, C-227, C-228, C-231 banner/leave
3. **Frontend (admin)** — C-229 settings tab (после Backend API)
4. **Tester** — guards + smoke localhost
5. **Fixer** — до зелёного
6. **Deployer** — localhost web+api+admin
7. **Client** — приёмка

Skills: `livekit-voice-rooms`, `backend`, `voice-room-safety` (patterns), `tester`, `deployer`.
Motion / WebGL / AI Bridge — не нужны.
