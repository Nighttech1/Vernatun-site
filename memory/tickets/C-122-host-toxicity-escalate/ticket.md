# C-122 — Host escalate (toxicity stub)

**P1** · W-46 · closed

## Ожидание
- Host: кнопка «Escalate» у remote (рядом с Mute/Kick), видна на mobile (не только hover).
- `POST /api/lounge/moderation` action=`escalate`: mute цели + append `escalation.log` (или `moderation.log` с action escalate) + доп. штраф Trust (−25) если есть `target_client_id`.
- Без AI-классификатора; ручной escalate = stub до фазы 6.
- Data-safety: только append/update scores.

## Зона
Backend + Frontend
