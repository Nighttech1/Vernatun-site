# Spec W-14

## C-37 Fonts + film-mark
- Убрать принудительные `12px`/`16px` из `css/site.css` и `ensureBrandCss`.
- Оставить Century Gothic + azure colors.
- Чуть поднять мелкий текст: `.text-xs` ≈ 13–14px, `.text-sm` ≈ 15px (через brand CSS, без ломки `text-3xl`/`text-4xl`).
- Удалить `fitFilmMarkWidths` и любые `transform: scaleX` / letter-spacing fit.
- `.film-mark strong/em` — естественная ширина, размеры до W-13 (strong ~1.05–1.2rem, em ~0.7–0.75rem).

## C-38 Carousel + brand
- `.atmosphere-section` background → `#2A5A84` (как `.bento-tile--accent`).
- Header brand span: текст `ВЕРНАТУН` (uppercase).

## C-39 Calendar
- Grid: aside `minmax(22.5rem, 28.5rem)` (×1.5 от 19rem).
- Кнопка в карточке: «Присоединиться» → `https://t.me/MASClubb` (как хедер).
- Header/footer остаются `max-w-7xl` — правый край CTA совпадает с правым краем сетки.

Chain: Frontend → Tester → Fixer → Deployer → Client
