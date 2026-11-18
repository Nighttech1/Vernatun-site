### [C-229] Админ: пароль + вкладка настроек образцов модерации
- **Зона / Экран:** liverooms/admin
- **Факт:** Нет UI для правок keyword/pattern роботов; пароль только в env
- **Ожидание:**
  1. Сообщить владельцу пароль из `LOUNGE_OWNER_PASSWORD` (localhost)
  2. Вкладка «Настройки»: textarea по каждому sentinel (politic/censor/hate/spam…) — keywords/patterns
  3. API GET/PUT `/admin/sentinel-patterns` + файл в campus-data; клиентские sentinels читают remote patterns с fallback на defaults
- **Приоритет:** P0
- **Скрин-улика:** —
- **Зона:** Backend + Frontend (admin)
