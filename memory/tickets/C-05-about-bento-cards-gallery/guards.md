# Guards C-05

## Checks

1. `about.html` содержит `.bento-grid`, `.dest-card`, `circularGallery()`.
2. `index.html` **не** содержит `id="calendar"`, `id="materials"`, `id="articles"`, `clubCalendar`.
3. `about.html` **не** содержит `clubCalendar` / `#calendar`.
4. Картинки форматов: `/images/format-01.png` … `format-04.jpg`; галерея `/gallery/1.jpg`…`6.jpg`.

## Command smoke

```bash
rg -n "bento-grid|dest-card|circularGallery" about.html
rg -n "id=\"calendar\"|clubCalendar|id=\"materials\"" index.html
```

Pass if about has craft blocks and index has no schedule/materials/articles sections.
