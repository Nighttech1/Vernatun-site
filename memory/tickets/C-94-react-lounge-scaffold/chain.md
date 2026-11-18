# Chain — W-37 (C-94, C-95, C-96)

Общий chain на волну. Overlapping paths: всё в `liverooms/web/` — **не параллелить** Frontend с собой.

```
Архитектор (done → этот файл + architect-spec.md)
  → Frontend A (C-94 scaffold → C-95 lobby → C-96 room shell)
  → Backend (optional: CORS только если vite proxy недостаточен)
  → Тестировщик (build + anti_slop + Playwright desktop/mobile + guards)
  → Фиксер (до зелёного)
  → Деплоер localhost (vite preview / URL для Клиента; VPS SPA — НЕТ)
  → Клиент
```

## Paths Frontend owns
- `liverooms/web/**`
- docs: `liverooms/web/README.md`

## Paths Backend may touch (only if needed)
- `liverooms/infra/vps/lounge_api.py` or `liverooms/meet/token_server.py` — CORS headers only
- **Запрет:** wipe chat/, rooms.json, webhooks.log

## Paths Deployer
- Local serve only; update `memory/waves/W-37-react-lounge-phase3.md` with localhost URL
- Do not run full `deploy_vernatun_to_vps.ps1` for SPA cutover

## Skills
- `livekit-voice-rooms`, `luxury-web-craft`, `responsive-mobile-web`, `mobile-touch-scroll`
- MCP: `livekit-docs`, playwright ×3

## Order inside Frontend
1. C-94 scaffold + tokens + router shell  
2. C-95 LobbyPage  
3. C-96 RoomPage + LiveKit + chat/share  
Then Tester.
