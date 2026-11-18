# Guards C-172 — NSFW board scanner

## Executable checks
1. `nsfwScanner.ts` lazy-loads model; on load failure → degrade allow (no hard crash)
2. Thresholds: Hentai+Porn ≥ 0.60 OR Sexy ≥ 0.85 → not allowed
3. On violation: POST `/api/lounge/moderation/canvas-violation` + brush lock ~120s UI
4. Force flag `__VERNATUN_NSFW_FORCE__` for deterministic UI test without drawing porn

## Permanent
- Inference client-side only; no continuous server canvas upload
- VernatunWhiteboard debounce ~2500ms after stroke end

## Regression
Board still works if TensorFlow CDN/model fails (graceful allow + console warn).
