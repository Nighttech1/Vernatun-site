# Guards C-212 — Shape author nick labels (screenshot shield)

## Executable checks
1. `ShapeAuthorLabels.tsx` exists and is mounted inside `VernatunWhiteboard` `<Tldraw>` children.
2. Labels are derived from `shape.meta.createdByNickname` for **every** authored shape on the page (always visible, not only on hover).
3. Selected shapes get visual emphasis (`.shape-author-chip.is-selected`).
4. On selection change, `VernatunWhiteboard` sets `selectedAuthor` from `meta.createdByClientId` / `createdByNickname` (feeds host purge).
5. New shapes stamped with immutable author meta (`createdByClientId`, `createdByNickname`) when missing (C-205 continuity).

## Permanent
- Nick chips must remain in DOM for window screenshots (pointer-events: none overlay OK).

## Regression
- Labels must not block drawing (`pointer-events: none` on overlay).
- Host purge-by-author still keyed off selected shape meta.

## Smoke (W-65)
```
# files: ShapeAuthorLabels.tsx, VernatunWhiteboard ShapeAuthorLabels + selectedAuthor
# css: .shape-author-labels / .shape-author-chip
cd liverooms/web && npx tsc --noEmit
```
