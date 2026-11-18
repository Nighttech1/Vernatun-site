# Guards C-04

## Checks

1. `js/site.js` — `headerHtml` содержит OriginUI-like `h-16`, mobile hamburger paths, CTA «Запись».
2. `footerHtml` — логотип в `flex` **слева** от колонок (`lg:flex-row`), фон `bg-parchment`, текст `text-azure` (не белый на azure).
3. `css/site.css` — `body { color: #2A5A84 }`; overrides `.text-ink/*` → azure rgba.
4. Nav hrefs: `/about.html`, `/schedule.html`, `/materials.html`, `/articles.html`, `/contacts.html`.

## Command smoke

```bash
rg -n "footerHtml|bg-parchment text-azure|h-16" js/site.js
rg -n "color: #2A5A84" css/site.css
```

Pass if footer logo precedes columns and body color is azure.
