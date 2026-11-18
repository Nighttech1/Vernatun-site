# W-15 regression
- Do not re-inflate `.cal-pill` via ensureBrandCss text-xs bump.
- Dance only on Sep 13 & 26, not every Saturday.
- Volleyball Sundays 15–17; no event-card CTA/siblings.
- Calendar grid: flat `flatCells` with stable `cell.key` — never nested `x-for` over a `get weeks()` that returns new arrays (scrambles DOM order).
