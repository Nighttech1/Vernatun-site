# Guards — C-136 Fair Meter / lexicon light motion

## Checks
- [x] Fair fill uses `transform: scaleX(var(--fair-pct))`, not layout `width` transition
- [x] Lexicon focus/list enter: `lexicon-enter` 160–180ms, opacity+transform
- [x] `prefers-reduced-motion: reduce` disables transitions/animations
- [x] Campus lobby loads on localhost (`5173/campus`) — visual/after-lobby.png
- [x] No GSAP/Lenis added to room shell

## Regression
Mute-by-default / multi-party / mic CTA не менялись в этой волне.
