---
name: a11y-mobile-qa
description: Mobile accessibility QA via Chrome DevTools MCP — tap targets 48px, contrast, focus, lighthouse a11y on mobile viewport. Use when Tester or Client accepts premium mobile layout.
---

# A11y Mobile QA (Chrome DevTools)

Официальный паттерн: [Chrome DevTools a11y-debugging](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/skills/a11y-debugging/SKILL.md).

## MCP

- `chrome-devtools` — desktop debug + `lighthouse_audit`
- `chrome-devtools-mobile` — viewport ~393×852
- `a11y` — быстрый axe/контраст
- `lighthouse` — LCP/CLS/INP (mobile)

## Ритуал (mobile)

1. Открой localhost на `chrome-devtools-mobile` или `emulate` 393×852 + touch.
2. `lighthouse_audit` device=`mobile` — a11y score; failures → тикеты.
3. Tap targets ≥ 48×48 (web.dev); меню/CTA на пальце.
4. Контраст текста на фото/видео — отдельно, не верь только axe-URL.
5. Focus: Tab по меню/модалке без ловушки вне диалога.

## Hard fail для Клиента

- CTA < 44px по короткой стороне
- Горизонтальный overflow из‑за absolute/transform
- Недоступное бургер-меню / закрытие оверлея

`🧪 **A11Y-MOBILE:** score / tap / contrast / focus`
