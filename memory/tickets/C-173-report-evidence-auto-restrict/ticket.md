# C-173 — Жалобы с доказательствами и авто-ограничение

**P1** · W-58 · open

## Зона / Экран
Report dialog + host mute/kick (уже есть) + Trust / restrictions

## Факт
Жалоба текстовая без снимка доски и без 15 с аудио. Нет авто-mute/блок доски после 3 жалоб от разных сессий в одной комнате. Причины не по кодам ТЗ.

## Ожидание (ТЗ этап 5)
- Причины: POLITICAL_EXTREMISM / NSFW_CANVAS / OFFENSIVE_VOICE / FLOOD_SPAM.
- Пакет: JPEG доски (q≈0.4) + последние ≤10 сообщений чата + опционально 15 с rolling audio буфера нарушителя (AudioWorklet; если нет — без аудио, не блокер).
- `POST /api/lounge/report` расширить; audit; при ≥3 разных reporter_client_id → auto micMuted + boardBlocked до конца сессии.
- Host mute/kick / canvas access уже частично есть (C-161) — не ломать; дотянуть gap из DoD.

## Приоритет
P1

## Зона
Frontend + Backend

## Скрин-улика
visual/after.png — форма жалобы с причинами
