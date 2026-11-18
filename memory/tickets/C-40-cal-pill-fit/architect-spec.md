# Spec W-15

## C-40
- Убрать `.cal-pill` из bump `0.8125rem` в `ensureBrandCss`.
- CSS: меньший `font-size` (≈0.55–0.62rem), `overflow:hidden; text-overflow:ellipsis` если нужно; Клиент смотрит скрин.

## C-41
- В `schedule.html` card: убрать badge kindLabel, siblings, кнопку Присоединиться.
- Строка дата·время `text-right` / `ml-auto` у правого края.
- Оставить `h3` title + `p` description.

## C-42
- `clubCalendar` стартует с `new Date()` year/month.
- Talk: каждый Чт 20:00–23:00, каждая Сб 15:00–18:00 (любой месяц).
- Dance: только даты 13 и 26 **сентября** (month===8), 19:00–21:00 — не каждая суббота.
- Volleyball: каждое вс 15:00–17:00.
- Единый `padDateKey` с нулями `YYYY-MM-DD` для стабильного индекса.

Chain: Frontend → Tester → Fixer → Deployer → Client
