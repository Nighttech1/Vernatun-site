### [C-240] Sentinel chat: скрин+кабинет+wipe+kick; доска — план+MVP текст
- **Зона:** chat sentinel + board + API kick
- **Факт:** Сейчас hit только блокирует отправку / incident без kick
- **Ожидание чат:** при hit по owner keywords → capture evidence → POST incident/inbox → сообщение не публикуется / удаляется → LiveKit kick нарушителя
- **Доска (решение Архитектора):** hybrid MVP — сканировать text/note shapes теми же keywords; растр/символы — предложение в spec (период. canvas + nsfwjs + будущий symbol OCR)
- **Приоритет:** P0
- **Зона:** Backend + Frontend + AI Bridge light
