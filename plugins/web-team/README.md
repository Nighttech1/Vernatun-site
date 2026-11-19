# Web team tools

Read docs/WEB_TEAM_READINESS.md and AGENTS.md. sources.lock.json records vendored skill revisions and MCP versions.
mcp.example.json is a template, not an active server configuration.

## Connect in a development environment

Requirements: npm registry access, Node compatible with both pinned packages (use Node 22.12+), installed browser dependencies, Chrome for DevTools.
Merge the relevant entries into the host's MCP configuration: Cursor .cursor/mcp.json, Claude Code .mcp.json, or the supported Codex MCP settings. Do not replace unrelated entries.
Use one isolated browser server for the task; do not launch both against the same profile.
If npm/SSH is blocked on the office machine, use the authorised cloud development environment. No need to change VPS to install developer browser tools.
First verify package --help, then MCP connection/tool discovery, then a screenshot of local preview; DevTools additionally needs a successful navigation performance trace.
Record host, versions and artifact paths. Pinned versions were checked in upstream package.json; no live MCP handshake was performed in this task.
If flags or tool schemas differ, read the actual server's schema and update skill+package versions together.

## Role outputs

Frontend: token/layout rationale + responsive result.
Motion: storyboard + reduced-motion + lifecycle cleanup.
Tester: screenshots and replayable checks.
Client: independent verdict with evidence.
Deployer: preview URL and verified release SHA only after actual deployment.

## Current limitations

Playwright MCP does not replace existing TypeScript tests or prove two-peer audio.
DevTools skills need a functioning compatible MCP host; reading their instructions alone does not enable tools.
Do not use unconditional networkidle for Campus polling/WebSocket views: wait for explicit readiness.
Hugging Face is optional for future AI model evaluation and must not block landing work.
