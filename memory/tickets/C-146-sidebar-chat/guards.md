# Guards — C-146 sidebar + chat

1. Desktop ≥1024: `.room-col--chat` computed width ≈ **640px**.
2. Chat input not disabled solely by LiveKit `!connected`.
3. `POST /api/lounge/chat` succeeds; poll does not wipe messages when LiveKit API errors (`livekit_online` → None).
4. Send shows error text on API failure.
