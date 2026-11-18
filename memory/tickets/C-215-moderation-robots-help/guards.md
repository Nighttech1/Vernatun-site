# Guards C-215 — Moderation robots help (?) + 3 non-LLM roles

## Executable checks
1. `admin/index.html`: button `#robots-help-btn` («?») visible on Модерация tab; modal `#robots-help-modal`.
2. Modal documents **exactly three** robot cards (non-LLM / rule-based framing):
   - Политика / повестка (political agitation)
   - Оскорбления / тон (insults, profanity)
   - 18+ / холст (NSFW board scanner — not an LLM)
3. `admin/app.js`: show help btn when `tab === 'moderation'`; open/close handlers for modal.
4. Instruction body may be placeholder («Инструкция: ожидает ваш текст») until client copy arrives — placeholders OK; roles must remain.

## Permanent
- Help affordance stays on Модерация; three roles stay enumerated for operators.

## Regression
- Help button hidden on Жалобы / Баны tabs.
- Do not replace these scanners with an LLM moderator without a new ticket.

## Smoke (W-65)
```
# admin/index.html: robots-help-btn, 3× robot-card (Повестка / Тон / Холст 18+)
# admin/app.js: openRobotsHelp / robotsHelpBtn.hidden
```
