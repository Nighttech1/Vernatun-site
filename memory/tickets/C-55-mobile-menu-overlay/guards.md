# Guards — C-55 Mobile menu overlay

## Assert
1. На iPhone 15 / Pixel 7: открыть бургер на film-hero → `.site-mobile-drawer` background = `#F9F6F0` / `rgb(249, 246, 240)`.
2. `header` имеет `is-solid` + `is-mobile-open`; `.site-brand-name` color = `rgb(42, 90, 132)`.
3. Ссылки меню не накладываются на цитату film-hero.
4. After: `after.png`.

## Regression
Не возвращать mobile drawer внутрь прозрачного `header.is-film` без `background: #F9F6F0 !important`.
