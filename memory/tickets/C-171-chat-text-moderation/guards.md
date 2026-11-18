# Guards C-171 — chat text moderation

## Executable checks
1. `validate_and_sanitize` masks known RU profanity roots (`*` replacement)
2. Extremism stop-patterns → HTTP **422** `BLOCKED_EXTREMISM_DETECTED` + audit.log entry
3. ChatPanel shows user-visible error on block; accepts censored message body

## Permanent
- Sanitization runs server-side in `append_chat` / POST `/api/lounge/chat` — client-only filter is not enough
- Audit append-only (sha256 of raw), never wipe logs on deploy

## Regression
Empty text still 400; CHAT_MAX retention unchanged.
