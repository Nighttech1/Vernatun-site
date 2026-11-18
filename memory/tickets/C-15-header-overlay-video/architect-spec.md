# W-06 Architect

## C-15
- Header: `fixed top-0 inset-x-0 z-50` (не занимает поток).
- `body` / `main` без лишнего padding; film-hero `min-height:100svh` от верха экрана.
- `is-film` пока `scrollY < hero.bottom - 64`; иначе `is-solid`.
- На solid: logo text azure; на film: logo span white, img ok.

## C-16
- Inject: `a.site-cta, a.site-cta:hover { color:#fff !important; }` после azure anchor rule.

## C-17
- radius 380/560/700; card 260×340 / 320×420; opacity floor 0.45; slightly faster autoRotate 0.06.
