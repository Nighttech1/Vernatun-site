# Плагины — client

| Name | Type | Path | When |
|------|------|------|------|
| client-review | skill | `.cursor/skills/client-review/SKILL.md` | вердикт, guards |
| web-visual-critic | skill | `.cursor/skills/web-visual-critic/SKILL.md` | арт-дирекшн |
| ticket-engine | skill | `.cursor/skills/ticket-engine/SKILL.md` | формат C-* |
| Playwright / Image Compare / A11y / Lighthouse | MCP | `.cursor/mcp.json` | глаза приёмки |
| voice-room-safety | skill | `.cursor/skills/voice-room-safety/SKILL.md` | reject дейтинг-UI / open-mic spam |
| livekit-voice-rooms | skill | `.cursor/skills/livekit-voice-rooms/SKILL.md` | acceptance Lounge |
| mobile MCP | MCP | playwright-iphone / android | mic CTA, safe-area, одна колонка |

Жёсткий reject Lounge: нет звука у двух пиров (ручная проверка), горизонтальный скролл, управление сценой только hover, профиль как Tinder.

## Усиление 19.11.2026

Маршрутизация новых официальных skills: AGENTS.md. Порядок работы и источники: docs/WEB_TEAM_READINESS.md и plugins/web-team/README.md.
Skills находятся в .agents/skills; MCP-примеры подготовлены в plugins/web-team/mcp.example.json, runtime ещё не подтверждён.
Для ассетов, SEO, accessibility и preview применять docs/WEB_QUALITY_PLAYBOOK.md.
