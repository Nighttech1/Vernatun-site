### [C-238] Админ: стабильный layout + collapse purge + lightbox скрина
- **Зона:** liverooms/admin
- **Факт:** Дергается при смене вкладок; «Удалить по правилу» не сворачивается; скрин нельзя увеличить
- **Ожидание:**
  1. Фикс. высота chrome (tabs/tools/purge) одинакова во всех разделах кроме Settings content
  2. Purge menu только по click `.is-open` (убрать hover-открытие); повторный клик / outside — свернуть включая days
  3. Клик по evidence img → modal lightbox по центру, Esc/клик закрыть
- **Приоритет:** P1
- **Зона:** Frontend (admin)
