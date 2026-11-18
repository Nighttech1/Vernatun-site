# Spec W-09 — C-24 / C-25 / C-26

## C-24 Header morph mega
- One shared `.site-mega` under desktop nav; open while any trigger hovered / panel hovered.
- Switching sections: **do not** unmount panel; animate width; slide links L↔R by direction.
- All menus `type: simple` (about: titles only).
- CTA: label «Присоединиться», href `https://t.me/MASClubb`.
- Nav links + brand: `font-bold` / 700.

## C-25 Formats
- Remove eyebrow «Форматы».
- Six cards: talk, games, informal, volleyball, **танцы**, **падел** (images: gallery or format-* copies).
- Grid: always 3 cols from md up → 2 rows.

## C-26 Atmosphere + film
- Remove eyebrow «Атмосфера».
- Wheel on `.atmosphere-section`: `preventDefault` + rotate ring; body page scroll unaffected only when pointer on `.atmosphere-outer` gutters.
- Film: `object-fit: cover`, vars `--film-zoom`, `--film-pos-x/y` (faces ~ mid-upper / ~3/4 source height).

## Chain
Frontend → Motion → Tester → Fixer → Deployer → Client
