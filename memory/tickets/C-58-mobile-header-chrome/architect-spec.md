# Architect — W-22 Mobile premium polish

## Тикеты
C-58 header chrome · C-59 formats mobile desc · C-60 magazine touch rows

## Chain
Архитектор → Frontend (+ Motion destTilt) → Тестировщик (iPhone+Pixel) → Фиксер → Деплоер localhost → Клиент

## Границы
Не ломать desktop hover formats ≥768. Не трогать VPS. Не менять контент текстов.

## Acceptance
1. CTA header h≥44, safe-area
2. Formats: `<p>` visible без hover на 390/412
3. Contacts/materials: «Открыть» pill ≥44, row card look
4. After-скрины + guards
