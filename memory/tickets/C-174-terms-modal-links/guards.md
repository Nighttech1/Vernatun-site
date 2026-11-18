# Guards W-59 (C-174…C-180)

## Checks
1. Hero: h1 «Кампус», subtitle «голосовые комнаты»; no visible empty mega pill (`.site-mega` display:none when closed).
2. Two hero buttons: Правила + Пользовательское соглашение → Terms modal.
3. Featured title/meta computed color white; card CTA bg #111, color white.
4. Badge shows `⏱ 1:30` when session inactive (remaining_sec=5400).
5. `#site-footer` mounted via `VernatunChrome.mountRest()`; link `[data-vernatun-terms]`.
6. LegalGate has clickable «Пользовательское соглашение» opening TermsOfServiceModal.
