# C-140 — STT поток реплики

**P2** · W-50 · open

## Зона
Lounge API + room client (DataChannel / POST)

## Факт
Фаза 6: нет пути текст/аудио реплики в STT. Нужен MVP без egress recording.

## Ожидание
- Consent-gated путь в STT (text-first; audio optional later).
- Degraded stub без ключа провайдера.
- SFU не зависит от STT.

## Spec / Chain
`memory/waves/W-50-phase6-ai/architect-spec.md` · `chain.md`
