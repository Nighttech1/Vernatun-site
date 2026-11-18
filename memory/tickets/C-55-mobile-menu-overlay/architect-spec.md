# Architect spec — W-21 Mobile premium Vernatun

## Цель
Премиум мобильная вёрстка сайта Vernatun: скролл пальцем, меню, анимации сопоставимы с desktop. Волна закрывает ≤3 P0.

## Стек
Статический HTML + Alpine + Tailwind CDN + `css/site.css` + `js/site.js`. MCP: playwright-iphone / android (после reload Cursor), chrome-devtools-mobile, lighthouse.

## Тикеты волны
| ID | Суть | Роль |
|----|------|------|
| C-55 | Mobile menu opaque overlay на film | Frontend |
| C-56 | Circular touch не блокирует scroll | Motion → Frontend CSS |
| C-57 | Schedule calendar mobile readable | Frontend |

## Границы
- Не трогать desktop mega-menu поведение ≥768
- Не удалять данные / gallery assets
- Не деплоить VPS без вердикта Клиента
- Backend / AI Bridge — вне scope

## Acceptance (Клиент)
1. iPhone + Android: бургер → непрозрачная панель, ссылки читаемы, закрытие работает
2. Палец проходит atmosphere без залипания; кольцо живёт (auto/horizontal)
3. schedule: пилюли/метки читаемы, tap ≥44px короткой стороны
4. Нет document overflow-x
5. After-скрины + guards

## Skills
`responsive-mobile-web`, `mobile-touch-scroll`, `luxury-web-craft`, `web-motion-engine`, `a11y-mobile-qa`
