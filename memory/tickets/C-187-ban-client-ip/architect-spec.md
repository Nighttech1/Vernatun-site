# Architect-spec — Variant A: Ban by client_id + IP

## Decision
Клиент выбрал **вариант A** (MVP). Fingerprint (B) и VK ID (C) — вне волны.

## Model
Append-only `LOUNGE_CAMPUS_DATA/bans.jsonl` lines:
```json
{"id","ts","action":"ban"|"lift","client_id","ip","until","reason","room","source_report_id","by":"owner"}
```
Active ban = last matching ban without later lift, and `until==0` or `until > now`.

Also `client_seen.jsonl` / in-memory map: last IP per client_id on successful token (for ban-from-report).

## API
| Method | Path | Auth | Behavior |
|--------|------|------|----------|
| GET | `/api/lounge/token` | — | After legal consent: if banned → **403** `{error:banned, hint}` |
| POST | `/api/lounge/admin/bans` | Owner | body: client_id?, ip?, until_days?, reason?, room? |
| GET | `/api/lounge/admin/bans` | Owner | active bans list |
| POST | `/api/lounge/admin/bans/lift` | Owner | body: ban_id or client_id/ip |

## Admin UX
- On report detail: button «Заблокировать» (uses target_client_id + last IP if known).
- Tab «Баны»: list + «Снять бан».

## Privacy
Terms/Privacy modal + footer link: store client_id, IP, complaints, bans for safety/moderation; retention while ban active + audit.

## Acceptance
1. Ban from inbox → same client_id cannot get token.
2. Lift → token works again.
3. Privacy text visible from footer/lobby.
4. Localhost: campus + admin + API up.
