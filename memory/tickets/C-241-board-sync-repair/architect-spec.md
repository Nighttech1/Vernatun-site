# Architect-spec — W-69

## C-241 Board sync (P0) — must dual-test
**Root cause:** `persistenceKey` → per-browser IndexedDB fights LiveKit merges; large snapshots fragile.

**Fix:**
1. When `livekitRoom` present: **no persistenceKey** (ephemeral store).
2. Rewrite `useLivekitTldrawSync`:
   - listen document user changes
   - publish `board.sync.shapes` with serialized `{added,updated,removed}` shape records (prefer shapes+bindings only, strip assets blobs if huge)
   - on `board.sync.request`: reply with `getSnapshot()` document chunked OR serializePageShapes
   - apply via `store.put` / `remove` inside `mergeRemoteChanges`
   - re-request sync 1s after mount; host/any peer with shapes answers
3. Dual Playwright/browser test before Client accept.

## C-242 Guest label
CSS: remove banner box (bg/border/padding strip). Overlay text absolute top-center on board, `color:#c95b36 !important` always. No azure variants.

## C-243 Host transfer
**BE:** `POST /api/lounge/host/transfer` `{room, from_identity, to_identity}` — verify from is host, set metadata roles.
**BE:** on webhook participant_left if leaver was host → promote earliest remaining joined_at.
**FE:** VernMsg `host.changed { identity }`; ParticipantList host menu «Сделать ведущим»; local hostMode from metadata + msg.

## C-244 Report selects
`.report-dialog-select` → same vernatun-select styling as admin (appearance:none, cream, azure caret).

## C-245–247 Admin
- Equal column grid for all tabs; robot filters don't change tools height oddly
- RU names for robots
- Settings: remove list-chrome inert empty bar OR collapse chrome on settings (`display:none` + no min-height reserve). Modal editor for keywords/patterns.

## 6.5 Without expensive OCR
Robots **cannot reliably read freehand marker glyphs** without vision/OCR. Options without paid OCR API:
- Text shapes / typed notes — already scanned (keywords)
- Periodic canvas thumbnail + existing **nsfwjs** (photo NSFW, not letters)
- Lightweight **template match** for few known hate symbols (swastika) as image patches — limited
- True handwritten text → need OCR (Tesseract WASM free but heavy/inaccurate) or cloud vision

Honest answer to Client: маркером-написанное «слово» без OCR почти не читается; символы-шаблоны — частично; typed text — да.

## Chain
Backend (host transfer) → Frontend web (sync+banner+report+host UI) → Admin → Tester dual-board → Deployer → Client
