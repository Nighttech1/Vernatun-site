# C-56 — Circular gallery перехватывает палец

- **Зона / Экран:** Главная #atmosphere, iPhone 15 / Pixel 7
- **Факт:** `.circular-sticky/.circular-stage { touch-action: none }` + `touchmove preventDefault` — страница не скроллится пальцем над галереей; огромные боковые поля atmosphere
- **Ожидание:** На `<768` — `touch-action: pan-y`, без preventDefault на вертикали; кольцо крутится авто или горизонтальным свайпом; страница скроллится плавно
- **Приоритет:** P0
- **Скрин-улика:** `before.png` + audit touchAction none
- **Зона:** Motion (+ Frontend CSS)
