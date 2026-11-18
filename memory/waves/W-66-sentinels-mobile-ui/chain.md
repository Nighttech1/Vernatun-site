# Chain W-66 — Sentinels + mobile UI

```
Архитектор → Frontend → Backend → Тестировщик → Фиксер → Деплоер → Клиент
```

| Step | Role | Scope | Tickets |
|------|------|--------|---------|
| 1 | **Архитектор** | `architect-spec.md` + этот `chain.md` + wave summary + C-216…C-223 | all (meta) |
| 2 | **Frontend** | Mobile QA layout; guest banner; author labels; board lock UI; images-only upload; LegalGate spacing; drawing tool popovers; client sentinels hooks (capture → POST → delete shape/chat); Admin help modal ×5; Admin Moderation list UI for incidents | C-216, C-217 (client+admin UI), C-218…C-223 |
| 3 | **Backend** | `POST/GET` incidents API; persist incidents; **no** auto-ban / mute / trust from sentinels; Admin moderation feed includes incidents; keyword/regex/heuristic helpers if server-side; docs stub for future LLM prompts | C-217 (API + storage) |
| 4 | **Тестировщик** | Playwright iPhone + Android room; unit/smoke incidents (no sanctions); guards per ticket; `tsc` / build web | all |
| 5 | **Фиксер** | Только зелёный; архитектуру не менять | failing |
| 6 | **Деплоер** | Localhost Vite + lounge_api + admin; **VPS readiness checklist** (volumes, env, rollback) — **без** VPS cutover | deploy gate |
| 7 | **Клиент** | Desktop 1440 + mobile MCP; вердикт; prod только после OK без P0/P1 | acceptance |

## Explicitly NOT in chain

- AI Bridge / live LLM / RAG
- Motion / WebGL
- Realtime SFU capacity work
- Auto Trust Score penalties from sentinels

## Overlap rule

Не параллелить Frontend и Backend на одних и тех же контрактных файлах incidents до фиксации API в Backend; Frontend может сначала заложить клиентский hook на зафиксированный контракт из `architect-spec.md`, Backend реализует endpoint, затем FE стыкует Admin feed.
