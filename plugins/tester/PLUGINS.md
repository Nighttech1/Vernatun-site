# Плагины — tester

| Name | Type | Path | When |
|------|------|------|------|
| tester | skill | `.cursor/skills/tester/SKILL.md` | guards, регресс |
| anti_slop_scan | CLI | `plugins/frontend/anti_slop_scan.py` | UI-волна |
| Lighthouse MCP | MCP | lighthouse | LCP/CLS/INP |
| Playwright MCP | MCP | playwright | скрины |
| sqlite MCP | MCP | sqlite | SELECT/PRAGMA only |
| livekit-voice-rooms | skill | `.cursor/skills/livekit-voice-rooms/SKILL.md` | guards Lounge |
| livekit-health | CLI | `plugins/realtime/livekit_health_check.py` | SFU up после деплоя |
| dual-peer audio | manual guard | memory/tickets/.../guards.md | Playwright ≠ двусторонний звук |
| livekit-docs | MCP | `https://docs.livekit.io/mcp` | ожидаемое поведение SDK |

## Усиление 19.11.2026

Маршрутизация новых официальных skills: AGENTS.md. Порядок работы и источники: docs/WEB_TEAM_READINESS.md и plugins/web-team/README.md.
Skills находятся в .agents/skills; MCP-примеры подготовлены в plugins/web-team/mcp.example.json, runtime ещё не подтверждён.
Для ассетов, SEO, accessibility и preview применять docs/WEB_QUALITY_PLAYBOOK.md.
