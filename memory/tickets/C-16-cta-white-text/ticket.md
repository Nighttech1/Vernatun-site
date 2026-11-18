### [C-16] CTA «Запись» — белый текст (specificity)
- **Факт:** Playwright: `.site-cta` color `rgb(42,90,132)` при terracotta bg — правило `a:not(...)` сильнее `.site-cta`
- **Ожидание:** `a.site-cta { color:#fff !important }`
- **Приоритет:** P0
- **Зона:** Frontend
