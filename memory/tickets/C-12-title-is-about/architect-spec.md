# W-05 Architect

## C-12
- Перенести секции club/formats/atmosphere/faq с about → index после film-hero.
- about.html: meta refresh / JS location `/#club` + canonical hint.
- Nav items about hrefs → `/#club`, `/#formats`, `/#atmosphere`, `/#faq`.
- Film header: белый текст гарантированно (уже чинили; проверить на объединённой странице).

## C-13
- `#club`: intro text сверху; grid `1fr 1fr 1fr` равные min-height; 3 tiles (Атмосфера / Практика / Досуг).
- Mono: контейнер `.bento-mono`; default цветные; при hover одной — остальные `filter: grayscale(1) opacity(0.55)`; активная full color + slight lift.

## C-14
- Rewrite `circularGallery` Alpine: rotateY на ring, item `rotateY(i*angle) translateZ(radius)`, opacity by angle; autoRotate RAF; scroll sets rotation; radius 280 mobile / 520 desktop; card ~240×320 / 300×400.
- Sticky stage ~100vh inside tall track OR full viewport sticky like demo.
- Video: `object-fit: contain; background:#1a242c;` remove scale crop.
