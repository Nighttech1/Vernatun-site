# Guards — C-97 DESIGN.md Swiss Editorial

## Checks (2026-09-21)
1. File exists: `liverooms/web/DESIGN.md` with terracotta `#C25E28`, navy, Plus Jakarta Sans
2. `src/styles/tokens.css` exposes `--brand-terracotta`, `--brand-navy`, `--brand-surface`
3. `index.html` loads Plus Jakarta Sans + Space Grotesk
4. `npm run build` green

## Regression
Missing DESIGN.md / purple SaaS tokens → reopen C-97.
