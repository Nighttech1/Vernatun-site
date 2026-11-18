# Guards C-217 — Campus Sentinels ×5 (Evidence-First, sanctions OFF)

## Executable checks
1. Admin `?` help: exactly **5** `.robot-card` — Повестка, Тон, Холст 18+, Спам, Границы; lead notes owner-only bans.
2. Client scanners: `agenda` / `tone` / `canvas18` / `spam` / `bounds` under `web/src/services/moderation/sentinels/`.
3. Pipeline: `runSentinelPipeline` → `POST /api/lounge/incidents` → delete content; toast «Контент снят модерацией»; never «вы заблокированы».
4. API mapping: `bounds`→`HATE`, `spam`→`SHIELD` in `SENTINEL_ID_TO_ROLE` (`lounge_api.py`).
5. Smoke POST (valid `client_id` 8–64 `[a-zA-Z0-9_-]`):
   - `sentinel_id=spam` → response `sentinel_role: SHIELD`
   - `sentinel_id=bounds` → response `sentinel_role: HATE`
6. Endpoint must not ban/mute/trust (no BAN in `SENTINEL_ACTIONS`).

## Permanent
- Append-only `incidents.jsonl`; Admin Модерация merges sentinel incidents.
- No live LLM moderation in this wave; prompts stay in docs/stubs only.

## Regression
- Keep sanctions owner-driven (Admin Баны). Do not wire auto-ban from incidents.
- Help modal must stay at 5 cards (not regress to W-65 ×3 stubs).

## Smoke (W-66)
```
POST /api/lounge/incidents {"room":"mansarda","sentinel_id":"spam",...} → SHIELD
POST /api/lounge/incidents {"room":"mansarda","sentinel_id":"bounds",...} → HATE
admin/index.html: 5× robot-card
```

## Verdict W-66 Tester
**PASS** — mapping + incidents smoke + 5 help cards + sanctions-off contract verified (API restarted with `.env` for live POST).
