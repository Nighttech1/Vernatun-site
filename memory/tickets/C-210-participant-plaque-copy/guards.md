# Guards C-210 — Remove «Это вы · 2× клик = ник» plaque copy

## Executable checks
1. `ParticipantList.tsx` must **not** contain the strings:
   - `Это вы`
   - `2× клик`
   - `2× клик = ник`
2. Local participant status line may show short `Вы` (speaking/mute states) but **not** the combined instructional plaque copy.
3. Double-click rename for self may remain via `onDoubleClick` / `title` tooltip; instructional copy must not appear as visible plaque body text.

## Permanent
- No user-facing plaque string explaining «2× клик = ник».

## Regression
- Rename-on-double-click for local user still works when `onRename` is provided.

## Smoke (W-65)
```
# no matches in ParticipantList.tsx for: Это вы | 2× клик
cd liverooms/web && npx tsc --noEmit
```
