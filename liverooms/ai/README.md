# Lounge AI (phase 6 stubs)

Prompts for private coach / toxicity. Used by `infra/vps/lounge_api.py`.

- Graceful degrade without `OPENAI_API_KEY`: heuristic stubs, HTTP 200 + `degraded:true`.
- No Telegram HITL. Coach output is private to the requesting identity only.
- Audio egress recording is L2 — V1 is text-first STT.
