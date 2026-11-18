# Spec W-07 (C-18 / C-19 / C-20)

## C-18 Dropdown
- Desktop mega/simple panels: `background: #F9F6F0` solid (not translucent), border mist, shadow.
- Inject via `ensureBrandCss` + class `site-dropdown-panel` so Tailwind cannot wash out.
- Mobile drawer already parchment — keep solid.

## C-19 Reveal
- Remove eager `reveal-visible` on mount (except `prefers-reduced-motion`).
- CSS: start `opacity:0; transform: translateY(1.25rem)`; visible → ease cubic-bezier ~0.22,1,0.36,1 ~0.7s.
- IO: threshold ~0.12, rootMargin `0px 0px -8% 0px`; unobserve after show.
- Apply `.reveal` to major cards/blocks on other pages if missing (schedule, materials, articles, contacts).

## C-20 Font
- Global: `"Century Gothic", CenturyGothic, AppleGothic, "URW Gothic", sans-serif`.
- Replace Google fonts link; update `tailwind-config` `fontFamily.sans` + `display` to same stack (user: all text).
- Brand CSS `font-family` on html/body/*.

## Out of wave
C-21…C-23 → W-08.
