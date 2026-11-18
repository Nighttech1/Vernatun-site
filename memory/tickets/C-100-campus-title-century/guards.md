# Guards — C-100 Кампус + Century Gothic

## Checks (2026-09-21)
1. Header link aria/text includes **Кампус** (not CAMPUS-only)
2. Computed `font-family` on body and `.campus-brand-title` contains `Century Gothic`
3. `index.html` has no Google Fonts Plus Jakarta / Space Grotesk
4. `npm run build` green

## Assert
```js
() => ({
  title: document.querySelector('.campus-brand-title')?.textContent,
  font: getComputedStyle(document.body).fontFamily
})
// title includes Кампус; font includes Century Gothic
```
