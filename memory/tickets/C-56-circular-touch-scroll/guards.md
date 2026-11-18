# Guards — C-56 Circular touch scroll

## Assert
1. `<768px`: `.circular-sticky` и `.circular-stage` → `touch-action: pan-y` (не `none`).
2. Vertical touchmove не вызывает `preventDefault` на atmosphere (axis `y` early-return).
3. Кольцо продолжает auto-rotate; горизонтальный свайп крутит.
4. After: `after.png`.

## Regression
Не ставить глобально `touch-action: none` на circular на mobile.
