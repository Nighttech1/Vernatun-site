# Vernatun: entry point for development agents

Read README.md, docs/WEB_TEAM_READINESS.md and docs/WEB_DEVELOPMENT_PLAN.md first.
This repository contains a static HTML/Alpine/Tailwind landing, React/Vite Campus, Python API and owner admin UI.
Use the Vernatun profile in .cursor/rules/vernatun-profile.mdc. Sputnik/Cortana, Flutter and FinGrad instructions are templates, not requirements for this product.

## Skill routing

- Visual direction: .agents/skills/frontend-design/SKILL.md, then existing .cursor/skills/brand and design-token-guardian.
- Motion: existing .cursor/skills/web-motion-engine/SKILL.md; WebGL only with architecture spec and static fallback.
- Browser test design: .agents/skills/webapp-testing/SKILL.md. Campus already uses TypeScript Playwright; extend it instead of introducing a second Python test suite.
- Performance: .agents/skills/chrome-devtools/SKILL.md and .agents/skills/debug-optimize-lcp/SKILL.md.
- Accessibility: .agents/skills/a11y-debugging/SKILL.md plus manual keyboard and touch checks.
- Assets, SEO, release evidence: docs/WEB_QUALITY_PLAYBOOK.md.
- Upstream sources and licenses: plugins/web-team/sources.lock.json and each skill's license.

Read only relevant skills. These project instructions adapt upstream examples: retain the brand; do not invent meeting dates, reviews or attendance numbers. Use rendered mockups instead of ASCII wireframes.
For realtime pages wait for concrete readiness conditions; networkidle may never occur. Browser emulation does not prove real iOS or dual-peer audio works.
Do not claim any MCP is installed from a registry entry. Configuration, connection and successful tool invocation are separate states.

## Delivery

Before feature code create architect-spec.md and chain.md in the wave/ticket; name paths and acceptance evidence. Existing client/orchestrator cycle remains applicable.
Author checks do not constitute independent Client acceptance. If an independent reviewer is unavailable, report acceptance pending.
Use README deployment rules. Every push to main currently triggers production deployment, including documentation changes.
For tooling-only work use a branch and PR; do not trigger a production release just to save skills.
Never include real user data, credentials or browser profiles in evidence.
