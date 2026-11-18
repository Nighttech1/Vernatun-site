# Плагины — Realtime (LiveKit / WebRTC ops)

| Name | Type | Path / URL | When |
|------|------|------------|------|
| livekit-voice-rooms | skill | `.cursor/skills/livekit-voice-rooms/SKILL.md` | любая задача Lounge |
| webrtc-realtime-ops | skill | `.cursor/skills/webrtc-realtime-ops/SKILL.md` | SFU / TURN / инциденты |
| voice-room-safety | skill | `.cursor/skills/voice-room-safety/SKILL.md` | модерация / trust (с Backend) |
| livekit-docs | MCP | `https://docs.livekit.io/mcp` | актуальные docs/SDK/changelog |
| livekit-health | CLI | `plugins/realtime/livekit_health_check.py` | smoke после деплоя ноды |
| livekit-monitor | ops UI | optional Docker `jossephus/livekit-monitor` | дашборд комнат (P2) |
| Prometheus | metrics | LiveKit native scrape | алерты SFU down |

## CLI

```powershell
python plugins/realtime/livekit_health_check.py --url http://127.0.0.1:7880
```

Требует env: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` (не коммитить).

## Secrets

Никогда не класть API secret в клиентский бандл или в git.
