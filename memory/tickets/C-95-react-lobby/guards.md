# Guards — C-95 React lobby

## Checks (2026-09-20)
1. `GET http://127.0.0.1:5173/api/lounge/rooms` via Vite proxy → 200 + `rooms[]`
2. Playwright desktop 1440: lobby shows ≥1 room link `/room?room=`
3. CEFR filter chips present (`Все` + values from API)
4. Mobile iPhone (393) + Android (412): `scrollWidth <= clientWidth` (no horizontal overflow)
5. Visual after: `memory/waves/W-37-after-lobby-desktop.png`, `…-iphone.png`, `…-android.png`

## Assert recipe
```js
() => ({
  overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  rooms: document.querySelectorAll('a[href*="/room?room="]').length
})
// expect overflow===false && rooms>=1
```

## Regression class
Empty lobby / broken API proxy / horizontal scroll on mobile → reopen C-95.
