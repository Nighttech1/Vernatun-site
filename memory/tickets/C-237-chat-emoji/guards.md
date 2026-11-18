# Guards W-68 C-232…C-240

## Static
- `tsc --noEmit` liverooms/web — pass
- `ast.parse(lounge_api.py)` — pass
- NameGateModal present; fetchToken passes `display_name`
- No ParticipantList onRename / dblclick rename
- VernMsg: peer.hello, peer.roster.request
- postSentinelEnforce + BLOCKED_OWNER_PATTERN kick path
- Admin: no hover purge open; evidence-lightbox; robot-filters
- CSS: legal-gate-room margin-bottom; shape-author-chip #2A5A84/#fff

## Manual Client
1. Gap before Важно on LegalGate
2. Name modal required; no rename in room; 2nd joiner sees 1st nick
3. Report dropdown live nicks
4. Note styles identical; author chips azure
5. Chat emoji
6. Admin tabs no jump; purge collapses; lightbox; robot filters
7. Owner keyword in chat → not posted, incident, kick
8. Board text keyword → delete + kick (MVP)

## Board watch L2 (documented, not fully built)
Periodic canvas + nsfwjs + hate glyph templates — DEVELOPMENT_PLAN backlog.
