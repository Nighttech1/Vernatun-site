# Guards — C-57 Schedule mobile cal

## Assert
1. iPhone/Pixel: `.cal-pill` текст короткий (`Клуб` / `Танцы` / `Мяч`), height ≥ 44px.
2. Нет `overflow-x` на `documentElement` на schedule.html.
3. After: `after.png`.

## Regression
Не возвращать длинный `Разговорный\nклуб` на viewport < 640 без увеличения ячеек.
