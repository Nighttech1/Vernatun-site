# Architect-spec — W-39 / C-100–C-102

## Цель
1. Раздел сверху зовётся **«Кампус»** (RU).
2. Весь текст Lounge SPA — **Century Gothic** как лендинг Вернатун.
3. Усилить визуальную близость к campus/room рефам (layout/токены Swiss), не меняя multi-party.

## C-100 Typography + naming
- `@font-face` Century Gothic из `/fonts/CenturyGothic.ttf` (+ Bold)
- `--font-sans` / `--font-mono` / `--font-display` → Century Gothic (mono labels тоже CG; tracking + uppercase вместо Space Grotesk)
- Удалить Google Fonts из `index.html`
- Header brand: **Вернатун** + chip/label **Кампус** (не CAMPUS); live pill можно оставить «LIVE» кратко или «Голосовые · LIVE»
- Footer/hero: «Vernatun Campus» в тексте можно оставить как бренд-фраза ИЛИ «Кампус Вернатун» — приоритет шапки = Кампус

## C-101 Lobby fidelity
Сверить блоки с campus `screen.png`: hero grid 7/5, featured navy, tabs, card CTAs full-width navy/terracotta. Rules link → scroll to friendly banner `#campus-rules`.

## C-102 Room fidelity
Dot-grid center; denser chrome; keep multi-party copy. No raise-hand.

## Chain
Frontend (C-100→C-101→C-102) → Tester → Fixer → Deployer localhost → Client

## Paths
`liverooms/web/**`, tickets C-100..C-102, wave W-39
