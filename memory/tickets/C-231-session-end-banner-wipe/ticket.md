### [C-231] Плашка 10 мин + kick + wipe чата/доски
- **Зона / Экран:** RoomConnected + session end
- **Факт:** Нет предупреждения за 10 мин; по окончании сессии контент может остаться локально
- **Ожидание:**
  1. При remainingSec ≤ 600 — оранжевая плашка сверху с белым countdown у всех
  2. При 0 — всех выкинуть в меню комнат (lobby); wipe chat + session + board (сервер + clear local tldraw persistence)
- **Приоритет:** P0
- **Скрин-улика:** —
- **Зона:** Frontend + Backend
