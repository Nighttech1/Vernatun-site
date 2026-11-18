# Architect-spec — W-59 Campus lobby polish + Terms

## Scope
1. **Terms modal** — shared `TermsOfServiceModal`; link from LegalGate, lobby button, site footer (custom event `vernatun-open-terms`).
2. **Hero** — title «Кампус» + subtitle «голосовые комнаты»; remove stray chrome above title (margin/empty).
3. **Featured + card CTAs** — force white text / black buttons / orange hover with `!important` (site.js azure override).
4. **Session badge** — replace «Ожидание» with timer; idle → full duration 1:30; active → remaining from API.
5. **Footer** — ensure `#site-footer` mounts via Layout (already); add Terms link in `js/site.js`.

## API
`GET /rooms` adds `session_active`, `remaining_sec` (if inactive → `SESSION_DURATION_SEC` 5400).

## Out of scope
VK ID; VPS deploy; new Owner ban UI (document existing admin inbox + kick/trust).
