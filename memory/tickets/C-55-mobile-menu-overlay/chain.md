# Chain — W-21 Mobile premium

1. **Архитектор** — spec (этот файл + C-55/56/57 tickets) ✅
2. **Frontend** — C-55 menu overlay; C-57 calendar mobile; CSS atmosphere gutters
3. **Motion** — C-56 circular touch (pan-y / no preventDefault vertical)
4. **Тестировщик** — Playwright iPhone+Pixel screenshots + overflow/touch audit
5. **Фиксер** — до зелёного
6. **Деплоер** — localhost :8080
7. **Клиент** — mobile-qa приёмка

Не параллелить Frontend+Motion на одних и тех же строках `circularGallery` / `site.css` circular — сначала Motion JS, потом Frontend CSS polish если нужно.
