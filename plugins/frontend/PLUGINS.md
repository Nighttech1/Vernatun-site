# Плагины — frontend (luxury web)

## Реестр

| Name | Type | URL / path | When to use |
|------|------|------------|-------------|
| luxury-web-craft | Cursor skill | `.cursor/skills/luxury-web-craft/SKILL.md` | вёрстка дорогих сайтов |
| image-to-luxury-ui | Cursor skill | `.cursor/skills/image-to-luxury-ui/SKILL.md` | референс-картинка → premium UI |
| create-design-md | Cursor skill | `.cursor/skills/create-design-md/SKILL.md` | DESIGN.md из референса |
| web-motion-engine | Cursor skill | `.cursor/skills/web-motion-engine/SKILL.md` | GSAP / Lenis / CSS motion |
| three-webgl-craft | Cursor skill | `.cursor/skills/three-webgl-craft/SKILL.md` | 3D-герой по chain |
| web-perf-motion | Cursor skill | `.cursor/skills/web-perf-motion/SKILL.md` | джанк, LCP, CLS |
| ui-ux-pro-max | Cursor skill | `.cursor/skills/ui-ux-pro-max/SKILL.md` | направление, не токены |
| taste-skill | Cursor skill | `.cursor/skills/taste-skill/SKILL.md` | anti-slop |
| emil-animate | Cursor skill | `.cursor/skills/emil-animate/SKILL.md` | сборка анимации |
| GSAP | npm | `gsap` | сцены, ScrollTrigger |
| Lenis | npm | `lenis` | гладкий скролл |
| Three | npm | `three` / `@react-three/fiber` | WebGL |
| Lottie | npm | `lottie-web` | редко, не вместо типа |
| anti_slop_scan | CLI | `plugins/frontend/anti_slop_scan.py` | перед сдачей UI |
| Prettier | extension | `esbenp.prettier-vscode` | формат |
| ESLint | extension | `dbaeumer.vscode-eslint` | JS/TS |
| Tailwind CSS IntelliSense | extension | `bradlc.vscode-tailwindcss` | только если проект на TW |
| Playwright | extension | `ms-playwright.playwright` | e2e / скрины |
| livekit-voice-rooms | skill | `.cursor/skills/livekit-voice-rooms/SKILL.md` | раздел Lounge |
| voice-room-didactics | skill | `.cursor/skills/voice-room-didactics/SKILL.md` | Scenario / Lexicon / Meter UI |
| voice-room-safety | skill | `.cursor/skills/voice-room-safety/SKILL.md` | антидейтинг UX, сцена/зал |
| livekit-docs | MCP | `https://docs.livekit.io/mcp` | `@livekit/components-react` API |
| @livekit/components-react | npm | в Lounge SPA | RoomAudioRenderer, hooks |

## CLI

```powershell
python plugins/frontend/anti_slop_scan.py .
```

## npm (в целевом сайте, не в этой папке)

```powershell
npm i gsap lenis
# 3D только по спеке:
npm i three
```

## Secrets

Ключи CDN/fonts не коммитить. `DESIGN.md` — канон.

## Усиление 19.11.2026

Маршрутизация новых официальных skills: AGENTS.md. Порядок работы и источники: docs/WEB_TEAM_READINESS.md и plugins/web-team/README.md.
Skills находятся в .agents/skills; MCP-примеры подготовлены в plugins/web-team/mcp.example.json, runtime ещё не подтверждён.
Для ассетов, SEO, accessibility и preview применять docs/WEB_QUALITY_PLAYBOOK.md.
