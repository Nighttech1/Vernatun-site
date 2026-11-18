# Guards C-221 — Board upload: images only (no PDF/Word)

## Executable checks
1. Board media `<input type="file">` has `accept="image/*"` (`CustomToolbar.tsx`).
2. `onFile` rejects non-`image/*` with alert about images only.
3. Toolbar title/tooltip: «Загрузить картинку…» (not PDF).
4. Files panel copy mentions картинку/аудио, not new PDF upload UX.
5. Do not delete existing campus-data PDFs without owner ask.

## Permanent
- New board uploads are images only; PDF picker removed from user path.

## Regression
- Do not re-add `application/pdf` to board media accept.

## Smoke (W-66)
```
# evaluate: input.accept === 'image/*'
# a11y name: «Загрузить картинку (не больше 30 МБ)»
```

## Verdict W-66 Tester
**PASS** (note: `RoomSidePanel` may still label historical `pdf` file type if present in list — no new upload path).
