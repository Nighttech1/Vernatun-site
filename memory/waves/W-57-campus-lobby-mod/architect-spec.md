# Architect W-57 — Campus lobby + host moderation

## Scope
C-161 host mod icons (mute/chat/board) · C-162 10 room names · C-163 lobby stats/CTA · C-164 rules modal · C-165 featured popular · C-166 no filters · C-167 site chrome localhost · C-168 no create + campus-data storage

## Product rules
1. Exactly **10** seed rooms in `liverooms/infra/vps/rooms.json` (titles from owner list).
2. **First joiner = host** (existing token logic `is_host = online_n == 0`).
3. Host click peer → mute mic / block chat / block board; visual icons on peer row + muted mic glyph.
4. Lobby: stats under lead; no quick-enter; no filters; featured = max online; rules modal only.
5. Localhost Vite serves **full site** (static HTML) + `/campus` SPA with **same** header/footer via `site.js`.
6. Public create disabled (HTTP 403). No create card in UI.
7. **Storage canon:** `LOUNGE_CAMPUS_DATA` → `{root}/rooms/{roomId}/chat.json|session.json|uploads/`
   - Local default: `liverooms/campus-data/`
   - VPS: `/var/www/vernatun/campus` (env) — deploy later after Client OK

## Out of scope
- Prod cutover / nginx (wait Client «деплой Кампус»)
- tldraw persistence to uploads/ (next wave)
- New SFU capacity work

## Chain
See `chain.md`: Frontend → Backend → Tester → Fixer → Deployer → Клиент
