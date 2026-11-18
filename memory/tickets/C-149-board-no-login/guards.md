# Guards — C-149 no-login board

1. `GET /api/lounge/board?room=open&nickname=…` → URL contains `/spaces/` and `spaceAuth=` (not bare home).
2. Room iframe `src` matches Instant Edit URL; guest Spacedeck **account** login not required.
3. Optional `nickname` query skips guest-name modal when Spacedeck supports it.
