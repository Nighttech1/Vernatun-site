# Guards C-35

- `header-bg.mp4` duration ≈ 38.9s (clip from original 1:41 / 101s), not full ~140s and not ~138s (old 1.41s mistake).
- On load: `currentTime` starts near 0 on trimmed file (= original 1:41); `paused === false`.
- No native `loop` attr; on `ended` / near-end `timeupdate` seeks to `data-loop-start` (0) and plays again.
- Probe shot: `memory/client-review/shots/w13-hero.png`
