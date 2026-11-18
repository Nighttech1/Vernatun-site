# C-123 — Playwright: лобби и UI-гейты

**P1** · W-46 · closed

## Ожидание
- Скрипт/тест Playwright (не медиа e2e): `/campus` лобби рендерит заголовок Кампус, список комнат или ошибку API, CTA «Войти» / быстрый вход.
- Фильтр CEFR кликабелен; нет горизонтального overflow на 390px (assert `scrollWidth <= clientWidth`).
- `npm` script в `liverooms/web` или `memory/waves/W-46-*/verify.cjs`.
- Не требует живого LiveKit для зелёного прохода (моки/стаб ответа rooms допустим; иначе skip если API down — лучше stub через vite proxy или fixture).

## Зона
Frontend / Tester tooling
