# Lighthouse — /campus (W-48)

**URL:** http://127.0.0.1:5173/campus  
**Режим:** Vite **dev** (не production bundle)

| Category | Score |
|----------|------:|
| Performance | 12 |
| Accessibility | 94 |
| Best Practices | 100 |

## Вердикт Tester
- A11y / Best Practices — ок для MVP.
- Performance низкий **на dev-сервере** (ожидаемо: HMR, крупные LiveKit chunks без prod minify split).  
  Повтор после prod cutover (`vite build` + nginx) — обязателен.
- Mic `aria-label` / `aria-pressed` — из W-45, без регресса в этом прогоне.

Raw: `lighthouse-campus.json`
