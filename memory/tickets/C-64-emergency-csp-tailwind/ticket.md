# C-64 — Emergency: CSP + Tailwind order (phone blank site)

- **Факт:** `upgrade-insecure-requests` на HTTP LAN ломал CSS/JS/CDN с телефона; `tailwind-config.js` грузился до CDN → ReferenceError
- **Фикс:** убран CSP meta; CDN → config на всех HTML; бренд снова виден на mobile
- **P0** closed
- Guards: console pageerror empty; headerLen > 0; sections film/club/formats/atmosphere/faq
