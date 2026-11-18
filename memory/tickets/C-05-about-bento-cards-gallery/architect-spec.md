# C-05 — About: bento + card-21 + circular gallery

## Границы страниц (уточнение C-03)

- `index.html` — только film-hero + короткий CTA (без calendar / materials / articles / about blocks)
- `about.html` — club bento + formats cards + atmosphere circular gallery + FAQ
- Расписание только `schedule.html`
- Материалы / статьи только свои страницы

## Блоки (адаптация 21st → HTML/CSS/JS)

1. **Bento monochrome** (`#club`) — сетка bento с 3–4 плитками (атмосфера / практика / досуг / клуб), цвета azure/parchment/sungold, без фиолетового slop
2. **Card-21** (`#formats`) — 4 destination-style карточки с фото format-01…04, лёгкий 3D tilt на hover (CSS/pointer), overlay текст azure
3. **Circular gallery** (`#atmosphere`) — интерактивная круговая галерея на `gallery/1…6.jpg`; scroll или drag; reduced-motion → статичная сетка

## Motion

Лёгкий tilt + circular rotation — Frontend; при необходимости донастройка Motion без смены разметки.

## Acceptance

На about: три новых блока с брендом; на index нет календаря/материалов/статей/дубля «о нас».
