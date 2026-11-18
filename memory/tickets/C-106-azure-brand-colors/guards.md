# Guards — C-106 azure brand colors

## Regression (DOM / CSS)
На `http://127.0.0.1:5173/campus`:
1. `--brand-azure` === `#2a5a84`
2. `--color-azure` === `#2a5a84` (не navy)
3. `--brand-surface` === `#f9f6f0` (parchment)
4. `--brand-terracotta` === `#c95b36`
5. `body` color `rgb(42, 90, 132)`; background `rgb(249, 246, 240)`
6. `.campus-filter-tab.is-active` background `rgb(42, 90, 132)`
7. `.campus-card-cta` background `rgb(42, 90, 132)`
8. `.campus-featured-card` background-image содержит `rgb(42, 90, 132)` / `rgb(31, 70, 104)`
9. Primary CTA `.campus-btn-primary` ≈ `rgb(201, 91, 54)` (terracotta)
10. В исходниках SPA нет hardcoded `#1e293b` / `#0f172a` как brand (кроме комментария deprecate)

## Visual
- `visual/before-desktop-1440.png` / `before-iphone.png` / `before-android.png`
- `visual/after-desktop-1440.png` / `after-iphone.png` / `after-android.png`

## anti_slop
`python plugins/frontend/anti_slop_scan.py liverooms/web/src` → OK
