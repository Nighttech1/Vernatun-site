# W-29 compare localhost vs VPS

## Finding
Server already had new HTML/CSS/JS/fonts after prior deploy.
But nginx served CSS/JS with `Cache-Control: public, immutable` + 7d expiry → phones/browsers kept OLD assets (including old fonts stack).

## Fixes
- Cal cells taller (8rem mobile) so 2 icons visible
- nginx: short cache for css/js; font/ttf MIME + CORS; no immutable
- Asset URLs `?v=20260912b` cache-bust
- Redeployed; live checks pass
