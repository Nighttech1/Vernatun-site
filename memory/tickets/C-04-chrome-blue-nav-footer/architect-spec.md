# C-04 — Chrome: azure text, OriginUI nav, Efferd footer

## Стек

Статический HTML + Tailwind CDN + Alpine + `js/site.js` (общий chrome). Не React.

## Токены (не менять палитру)

- azure `#2A5A84` — основной цвет **всего** текста (body, nav, footer links)
- parchment `#F9F6F0`, sungold, terracotta — акценты CTA/иконки
- display: Libre Caslon Text; sans: Be Vietnam Pro

## Хедер (OriginUI navigation-menu-4 → HTML)

- Sticky bar, logo слева, пункты с dropdown (О нас / Расписание / Материалы / Статьи / Контакты)
- Mobile: popover/hamburger как в референсе
- Ссылки на страницы: `/about.html`, `/schedule.html`, `/materials.html`, `/articles.html`, `/contacts.html` (+ якоря внутри about)
- CTA справа: запись / Telegram bot (terracotta button, белый текст — исключение)

## Футер (Efferd footer-section → HTML)

- Фон parchment или светлый, текст azure
- **Логотип слева** в одном ряду с колонками ссылок на разделы (не над ними)
- Колонки: О нас, Расписание, Материалы, Статьи, Контакты + соцсети
- Copyright снизу

## Файлы

- `js/site.js` — headerHtml / footerHtml
- `css/site.css` — body color azure; chrome helpers
- Все страницы наследуют chrome через mount

## Acceptance

На любой странице: текст синий azure; хедер с меню как у OriginUI; футер с лого слева от колонок.
