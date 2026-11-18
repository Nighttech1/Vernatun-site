# Guards — C-98 Lobby Campus Swiss

## Checks (2026-09-21)
1. `/lounge` DOM: brand «VERNATUN CAMPUS», hero CTA «Быстрый вход», filter tabs, ≥1 `article` room card
2. No horizontal overflow iPhone 393 / Android 412 (`scrollWidth <= clientWidth`)
3. Shots: `memory/waves/W-38-after-lobby-desktop.png`, `…-iphone.png`, `…-android.png`
4. `anti_slop_scan` OK on `liverooms/web/src`

## Assert
```js
() => ({
  campus: !!document.querySelector('.campus-hero'),
  cards: document.querySelectorAll('article a[href*="/room?room="]').length,
  overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
})
// campus && cards>=1 && !overflow
```
