# Guards C-214 — Admin report checkbox inside card

## Executable checks
1. `admin/app.js` list rows append checkbox as `.row-check.list-item-check` **sibling overlay** of `.list-card` (comment: inside card, not nested in `<button>`).
2. `admin/styles.css`:
   - `.list-item { position: relative }`
   - `.list-item-check` absolute with inset inside card bounds (`top`/`left` ~0.7rem, `z-index` ≥ 3)
   - `.list-card` left padding ≥ `2.4rem` so title text clears the checkbox
3. Checkbox must **not** sit as a separate column to the left of the card outside the card box.

## Permanent
- Selection checkbox visually inside the complaint/moderation card chrome.

## Regression
- Clicking checkbox must `stopPropagation` so it does not only select/deselect the detail pane unexpectedly; card click still selects item.
- Master «Все» checkbox in purge bar remains functional.

## Smoke (W-65)
```
# admin/styles.css: .list-item-check position absolute
# admin/app.js: list-item-check + li.append(btn, checkLabel, del)
```
