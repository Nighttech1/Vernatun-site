# Guards C-06

## Checks

1. `buildMonthEvents` в `js/site.js`: Thursday talk `20:00–23:00`, Saturday talk `15:00–18:00`, Saturday ethnic `19:00–21:00`.
2. `schedule.html` рендерит `.cal-icon` кнопки, не `.event-bar`.
3. Легенда без волейбола; aside показывает описание формата.
4. Материалы/статьи — на `materials.html` / `articles.html` (не на about).

## Command smoke

```bash
rg -n "20:00–23:00|15:00–18:00|19:00–21:00|cal-icon" js/site.js schedule.html
rg -n "event-bar|Волейбол" schedule.html
```

Pass if icons present, volleyball legend absent, slots match spec.
