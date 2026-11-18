# Guards — C-151 room height

1. `.room-app` height ≈ `100dvh`.
2. `.room-session` / `.lk-room-container` flex:1 fills under topbar.
3. Board stage not stuck at ~50% viewport (visual + getBoundingClientRect height > 0.55 * innerHeight).
