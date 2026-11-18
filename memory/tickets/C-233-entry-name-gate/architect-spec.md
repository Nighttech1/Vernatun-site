# Architect-spec — W-68 / C-232…C-240

## C-232 LegalGate gap
`.legal-gate-room { margin-bottom: 1.25rem }` или spacer — пустая визуальная строка до disclaimer.

## C-233 Entry name gate (P0)
1. **FE:** `NameGateModal` после LegalGate, до token. Поля: имя 2–40 символов. CTA «Продолжить» disabled пока пусто.
2. **BE:** `/token` принимает `display_name` (sanitize); если валидно — использовать вместо auto NonameN (или Noname только если пусто — но FE не пустит). `make_token(..., name=display_name)`.
3. **FE:** убрать dblclick rename / rename UI; оставить только `localDisplayName` из session.
4. **FE:** on RoomConnected: publish `peer.hello { name }`; on join request `peer.roster.request`; respond `peer.hello`. Fixes late-joiner.

## C-234 Report live nicks
`RoomConnected` peers for ReportDialog: map from LiveKit participants using same name resolution as ParticipantList (`p.name` || nameById). Lift name map to RoomConnected or shared hook `usePeerDisplayNames`.

## C-235 Board style sync
В `useLivekitTldrawSync`: убедиться store.listen source включает style changes; при diff apply использовать `editor.store.put` / mergeRemoteChanges без strip props. После локального style change — debounce snapshot fallback если diff truncated. Notes = tldraw `text`/`note` shapes — props в record целиком.

## C-236 Author chips
CSS only: `.shape-author-chip` background `#2A5A84 !important`; color `#fff !important`; remove inline color variance; same padding/font for all states.

## C-237 Chat emoji
ChatPanel: emoji button + popover grid (~40 common RU-chat emojis). Insert at cursor.

## C-238 Admin chrome
- Reserve min-height for list-tools + purge-bar even when hidden on settings (or always show empty placeholder same height).
- Remove `.purge-menu-wrap:hover .purge-menu`; toggle only `.is-open`. `closePurgeMenu` resets days hidden.
- Lightbox: `#evidence-lightbox` overlay; click img in detail opens; Esc/backdrop close.

## C-239 Robot filters
On moderation tab: bar with buttons All + 5 sentinels; counts from items by `sentinel_role` / `sentinel_badge` / kind. Filter `viewRows`.

## C-240 Sentinel kick + board watch
### Chat (implement)
Pipeline on hit (after POST ok):
1. evidence PNG (chat panel / room capture) → incident already
2. do NOT send message (already)
3. call `POST /api/lounge/moderate` kick self? No — kick the offender = local user who typed. API: existing host moderate OR new `POST /api/lounge/sentinel-enforce` with client_id that kicks via LiveKit remove_participant (owner-trusted: only after confirmed sentinel hit from same client — careful abuse). Safer: client after hit calls `POST /api/lounge/self-kick` or moderate with reason SENTINEL + room kicks local via leave after posting. **Product:** kick = remove from LiveKit room. Implement `POST /api/lounge/sentinel-action` body `{ room, client_id, identity, action: kick|delete_chat, incident_id }` authenticated by… for V1: allow if incident just created (pass incident_id) OR reuse moderation with service flag from client after evidence POST returns ok — Backend verifies and kicks.

Simplest V1 matching owner request: after `postIncident` ok, FE calls existing kick endpoint if any, else new BE `POST /api/lounge/incidents/{id}/enforce` that kicks identity from room. Chat message never sent.

Also server-side chat append: re-scan with load_sentinel_patterns(); if hit — reject + append incident + kick.

### Board monitoring — recommendation (Architect)
**Лучший вариант (hybrid):**
1. **Сейчас (MVP):** сканировать текст на фигурах note/text/vocab теми же owner keywords (уже частично useTldrawSentinel) → evidence PNG доски → incident → delete shapes → optional kick.
2. **Растр/символы (свастика и т.п.):** каждые N сек / on stroke idle — canvas thumbnail → существующий NSFW model + лёгкий template-match для известных hate glyphs (опционально L2). Не слать каждый штрих на сервер.
3. Не тащить полный server OCR в этой волне.

Implement MVP text-on-board with kick path same as chat; document L2 raster in DEVELOPMENT_PLAN.

## Chain
1. Backend (token display_name, sentinel enforce kick, server chat scan)
2. Frontend web (gates, names, report, board sync, chips, emoji, chat kick UX)
3. Frontend admin (layout, purge, lightbox, robot filters)
4. Tester → Fixer → Deployer localhost → Client

## Acceptance
Имя только на входе; late joiner видит ник; жалоба — актуальные ники; заметки одинаковые; chips azure; emoji в чате; админ без дёрганья; слова из Настроек → kick+инбокс; доска text MVP.
