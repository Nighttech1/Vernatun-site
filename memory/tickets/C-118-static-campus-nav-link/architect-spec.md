# Architect-spec — W-45 / C-118–C-120

## C-118 Static nav
`js/site.js` items lounge → label `Кампус`, href `/lounge`.  
`lounge.html`: one-line brand hint if missing. No React cutover.

## C-119 Trust + report
Files next to lounge_api: `trust.json` `{ "identity": { "score": 100, "updated": ts } }`, `reports.log` append JSON lines.

```
POST /api/lounge/report
{ room, reporter_identity, target_identity, reason? }
→ score_target = max(0, score - 15); log report
```

Token GET: load room cefr; if cefr in (B1+, B2, C1) or id slang with B1+ and trust(reporter? no - joining identity doesn't exist yet).

Joining identity is NEW each time (ahperik-N). Trust by identity won't persist across sessions well!

**Revise:** store trust by **display name pattern** is bad. Better: trust keyed by `fingerprint` cookie? Or by stable client id in localStorage sent as `?client_id=`.

Spec:
- Client sends `client_id` from localStorage `vernatun-client-id` (uuid) on token request and report.
- Trust keyed by `client_id`.
- Report: reporter_client_id, target_identity (LiveKit), target_client_id if known via DataChannel - skip for MVP: report target_identity only logs; reduce trust of **target_client_id** if we pass it from FE when reporting (participant metadata later).

MVP simpler:
- `client_id` in token query; stored in participant metadata `{"role","client_id"}`.
- Report includes `target_client_id` from remote participant metadata (parse) OR if missing only log without score drop.
- Trust gate on token: read trust[client_id].

## C-120
guards checklist file; RoomConnected mic aria-pressed={micOn} aria-label.

## Chain
```
Архитектор → Backend (C-119) → Frontend (C-118, C-119, C-120) → Тестировщик → Фиксер → Деплоер localhost → Клиент
```
