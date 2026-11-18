# Architect W-66 — Campus Sentinels ×5 + board/mobile polish

## Scope

| ID | P | Зона | Суть |
|----|---|------|------|
| C-217 | P0 | FE + BE + Admin + Docs | 5 Sentinels Evidence-First |
| C-216 | P1 | FE + Tester | Mobile room QA (iPhone + Android) |
| C-219 | P1 | FE | Author labels local-only |
| C-218 | P2 | FE | Guest banner orange / white |
| C-220 | P2 | FE | Board lock no confirm + blue active |
| C-221 | P2 | FE (+ copy if needed) | Images-only board upload |
| C-222 | P2 | FE | LegalGate consent spacing |
| C-223 | P2 | FE | Drawing tools color/size hover popover |

**Out of scope:** live LLM moderation; auto-ban/mute/trust; VPS cutover; C-214 (W-65 debt).

---

## C-217 — Product rules (Evidence-First)

### Pipeline (client + API)

```
detect (keyword | regex | heuristic)
  → capture evidence (shape snapshot / chat snippet / meta)
  → POST /api/lounge/incidents
  → on 2xx: delete offending shape and/or chat message locally (+ sync)
  → NEVER: ban | mute | board-block | trust decrement
```

Owner bans only via existing Admin Баны.

### Five Campus Sentinels (help modal + scanner ids)

Summarized owner role texts for Admin `?` modal (replace W-65 three stubs):

| id | Title | Role (summary) | Primary signals (non-LLM) |
|----|-------|----------------|---------------------------|
| `agenda` | Сентинел «Повестка» | Ловит политическую агитацию, пропаганду и геополитические провокации в чате/на доске; фиксирует улику, убирает контент, не наказывает сам. | keyword/regex lists (RU/EN/HY stubs) |
| `tone` | Сентинел «Тон» | Ловит мат, оскорбления, травлю и агрессивные выпады. | lexicons + obfuscation normalize (reuse `_normalize_for_moderation` patterns) |
| `canvas18` | Сентинел «Холст 18+» | Ловит эротику/порно/обнажение на доске и в чате-описаниях. | image heuristic hooks already present + text keywords; evidence = stroke/shape capture |
| `spam` | Сентинел «Спам» | Ловит спам, рекламу и вредоносные/подозрительные ссылки. | URL density, invite patterns, repeat flood heuristic |
| `bounds` | Сентинел «Границы» | Ловит домогательства, преследование после «стоп», утечку чужих ПДн/контактов без согласия. | phrase heuristics («напиши в лс», phone/email dump patterns) |

Full LLM prompt drafts → `liverooms/docs/sentinels-llm-prompts.md` (or `docs/lounge/sentinels-llm-prompts.md`) — **store only**, no runtime calls this wave.

### Incidents API (Backend)

**POST** `/api/lounge/incidents` (alias `/incidents`)

Request (JSON):

```json
{
  "room": "mansarda",
  "sentinel_id": "tone",
  "severity": "chat|shape|canvas",
  "identity": "…",
  "client_id": "…",
  "target_id": "shapeId|chatMsgId|null",
  "snippet": "≤2k chars redacted text or caption",
  "evidence": { "kind": "png_b64|text|meta", "payload": "…" },
  "matched": { "rule": "kw:…", "score": 0.0 }
}
```

Response: `{ "ok": true, "incident_id": "inc_…" }`

**Rules:**
- Append to durable store under campus-data / moderation path (e.g. `incidents.jsonl` or extend moderation.log + typed `event: SENTINEL_INCIDENT`). Prefer dedicated file for Admin filter.
- Also surface in Admin вкладка **Модерация** (list with sentinel, room, time, identity, snippet).
- **Forbidden side-effects:** do not call ban APIs, trust update, host mute, restriction writes.
- Auth: same trust model as `/report` / canvas-violation (room + client_id sanity); no new public write without room id check.

**GET** `/api/lounge/admin/incidents` (owner session) — newest first, pagination optional (limit 100).

Reuse existing admin auth cookie/session used by `/admin/moderation`.

### Admin UI

- Модерация: feed shows sentinel incidents (distinct badge / filter).
- `?` robots help: **exactly 5** cards with titles + summarized role texts above (no «ожидает ваш текст»).
- Note in modal: «Автоматы только фиксируют и убирают контент; блокировку выдаёт владелец».

### Client hooks (Frontend)

- Central `runSentinelPipeline(...)` used from chat send path + board shape-commit / NSFW path.
- On hit: evidence → POST → delete shape (`editor.deleteShapes`) or remove chat line via existing DC/API.
- Soft toast optional: «Контент снят модерацией» — **без** «вы заблокированы».
- Disable / do not wire any auto-sanction from W-50 toxicity stubs in this wave.

---

## C-216 — Mobile room QA

- Playwright projects: **iphone** (~390) + **android** (~412).
- Assert: no document-level horizontal scroll; primary CTAs (mic, leave, board controls if host) reachable without clip; toolbar/buttons not overlapping unreadably.
- Skills: `responsive-mobile-web`, `mobile-touch-scroll`, `a11y-mobile-qa`.
- Visual after-shots required for Client; DOM-only ≠ done.

---

## C-219 — Author labels

**Replace C-212 always-on behaviour:**

1. On local create: show chip briefly (~1.2–2s), then hide.
2. On select: show chip **only** for shapes whose `meta.createdBy` / identity === local user (multi-select OK — all local selected shapes).
3. Chip text: white (`#fff`) on chip bg.
4. Other peers must **not** see your selection-driven labels (labels are local overlay only; do not broadcast label visibility).
5. Do not keep permanent nick labels on all shapes (screenshot shield from C-212 is relaxed by owner request).

---

## C-218 — Guest banner

- Remove blue gradient / hatch look (`.board-guest-canvas-banner` currently slate→azure gradient).
- Style: **orange** title text on **white** board-adjacent background only; no navy fill.
- Keep height / «Гостевой холст участников» copy unless Client changes.

---

## C-220 — Board lock

- Host lock toggle: **no** `BoardConfirmModal` / confirm for lock (purge/clear may keep confirms).
- Active locked state: **blue outline** on lock control (not only opacity).
- Behaviour of `board.lock` DC message unchanged.

---

## C-221 — Upload images only

- `CustomToolbar` media accept: `image/*` only; remove PDF (+ Word if any) pickers and pdf page sync entry points from user upload UX.
- Update tooltips / Files panel copy («картинки», not «PDF»).
- Backend: reject non-image board uploads if endpoint enforces MIME (defensive); do not delete existing stored PDFs in campus-data without owner ask.
- PdfPageNav / remote `board.pdf.page` may remain dormant for old sessions — no new uploads.

---

## C-222 — LegalGate spacing

- Consent checkbox label + disclaimer: increase `line-height` and vertical gap so lines are not cramped (user screenshot).
- Target readable ~1.45–1.6 line-height; padding between disclaimer block and checkbox ≥ 0.75rem.

---

## C-223 — Drawing tools hover

- Pencil / marker / highlighter (draw tools): on hover (desktop) show popover for **color** + **size** (tldraw style panel subset).
- Mobile: tap-hold or secondary control — must not rely on hover alone (Client mobile REJECT).
- Do not reintroduce full default tldraw StylePanel chrome; keep Vernatun toolbar language.

---

## Skills / plugins

- Frontend: `livekit-voice-rooms`, `luxury-web-craft`, `responsive-mobile-web`, `mobile-touch-scroll`
- Backend: `backend`, `safe-db-migrations` (append-only incidents; no DROP)
- Safety framing: `voice-room-safety` (sanctions remain owner-driven)
- Tester: `tester` + Playwright MCP iphone/android
- Deployer: `deployer` + localhost; VPS checklist only

## Acceptance language (for Client)

- На телефоне комната без бокового скролла, кнопки досягаемы.
- Пять сентинелов в «?»; инцидент появляется в Модерации; контент исчезает; участник **не** банится роботом.
- Баннер гостя — оранжевый текст на белом; lock без диалога с синей обводкой; только картинки; LegalGate читаемый; у кисти hover color/size.
