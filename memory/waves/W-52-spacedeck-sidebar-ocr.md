# W-52 — Spacedeck board + sidebar/chat + OCR lexicon

**Статус:** deployed localhost · awaiting Client · 2026-09-25  

## Deployed
- Spacedeck Docker :9666 (build from github.com/spacedeck/spacedeck-open)
- Sidebar 640px; chat input always editable; chat wipe only when LiveKit confirms 0 peers
- Board iframe + OCR overlay → lexicon + translate stub
- Visual: `client-room-1440.png`

## Chain
См. `memory/waves/W-52-spacedeck-sidebar-ocr/chain.md`

## Localhost targets
- Campus http://127.0.0.1:5173/campus  
- Room http://127.0.0.1:5173/room?room=open  
- Spacedeck http://127.0.0.1:9666 (infra)  
- API http://127.0.0.1:8765/
