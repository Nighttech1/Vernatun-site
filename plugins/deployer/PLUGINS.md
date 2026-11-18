# Плагины — deployer

| Name | Type | Path | When |
|------|------|------|------|
| deployer | skill | `.cursor/skills/deployer/SKILL.md` | localhost / prod gate |
| webrtc-realtime-ops | skill | `.cursor/skills/webrtc-realtime-ops/SKILL.md` | LiveKit SFU / TURN / media VPS |
| livekit-voice-rooms | skill | `.cursor/skills/livekit-voice-rooms/SKILL.md` | деплой Lounge |
| livekit-docs | MCP | `https://docs.livekit.io/mcp` | актуальный install guide |
| livekit-health | CLI | `plugins/realtime/livekit_health_check.py` | smoke после рестарта ноды |

При Docker LiveKit: не затирать volumes с данными сессий приложения без явного запроса. Media node ≠ wipe `sputnik_data.db`.
