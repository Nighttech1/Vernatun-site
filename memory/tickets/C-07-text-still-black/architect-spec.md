# C-07 / C-08 / C-09 — W-03

## C-07 Text azure

Tailwind CDN injects after `site.css` → body/`text-*` становятся чёрными.
Фикс: инлайн `<style id="vernatun-tokens">` **после** tailwind script на страницах ИЛИ в конце `mountRest` inject style с `!important`:

```css
html, body { color: #2A5A84 !important; }
.text-azure, .text-ink, header, footer, h1, h2, h3, p, a, li, summary {
  color: #2A5A84 !important;
}
footer a { color: rgba(42,90,132,0.75) !important; }
.bg-terracotta, a.bg-terracotta, .bg-azure { color: #fff !important; }
.bento-tile--azure, .bento-tile--azure * { color: #F9F6F0 !important; }
.dest-card-body, .dest-card-body * { color: #F9F6F0 !important; }
.film-hero, .film-hero * { color: #fff !important; }
.film-quote span { color: #E6B25A !important; }
```

Плюс в `tailwind-config.js`: `theme.extend` уже есть azure — не полагаться на порядок CSS.

## C-08 Reveal

Вариант A (предпочтительный): убрать opacity-hide для section-level; анимировать только `transform`.
Вариант B: `rootMargin: '200px'` + сразу `reveal-visible` для всего ниже fold через requestAnimationFrame после mount.
Минимум: после mountRest пометить все `.reveal` как visible через 0ms/50ms fallback.

## C-09 Footer + gallery

Footer: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5` для колонок, лого `lg:col-span` отдельной колонкой в одной сетке, не flex-wrap.
Gallery: обёртка `min-h-[180vh]` + sticky stage `h-screen`, rotation от scroll progress секции (не window scroll глобально).
